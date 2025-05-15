import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import type { BrowserProvider } from "ethers";
import { useState } from "react";
import { z } from "zod";
import { RequireWallet, useWalletProvider } from "../components/RequireWallet";
import { type TransactionToExecute, useExecuteTransaction } from "../hooks/useExecuteTransaction";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";
import { type NonceGroup, useSafeQueue } from "../hooks/useSafeQueue";
import type { SafeConfiguration } from "../lib/safe";

// Define the route before the component so Route is in scope
export const Route = createFileRoute("/queue")({
	validateSearch: zodValidator(
		z.object({
			safe: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
		}),
	),
	component: QueuePage,
});

interface QueueContentProps {
	provider: BrowserProvider;
	safeAddress: string;
	safeConfig: SafeConfiguration;
}

function QueueContent({ provider, safeAddress, safeConfig }: QueueContentProps) {
	const {
		data: queue,
		isLoading: isLoadingQueue,
		error: queueError,
	} = useSafeQueue({ provider, safeAddress, safeConfig });

	// State for managing execution feedback for a specific transaction
	const [executingTxHash, setExecutingTxHash] = useState<string | null>(null);
	const [executionSuccessTxHash, setExecutionSuccessTxHash] = useState<string | null>(null);
	const [executionError, setExecutionError] = useState<Error | null>(null);

	const { mutate: execute, isPending: isExecutionPending } = useExecuteTransaction({
		provider,
		safeAddress,
		onSuccess: (data) => {
			console.log("Transaction executed successfully:", data);
			setExecutionSuccessTxHash(executingTxHash);
			setExecutingTxHash(null);
			setExecutionError(null);
		},
		onError: (err) => {
			console.error("Transaction execution failed:", err);
			setExecutionError(err);
			setExecutingTxHash(null);
		},
	});

	const handleExecuteTransaction = (txWithSigs: NonceGroup["transactions"][number]) => {
		const transactionToExecute: TransactionToExecute = {
			...txWithSigs.details,
			signatures: txWithSigs.signatures,
		};
		setExecutingTxHash(txWithSigs.safeTxHash);
		setExecutionSuccessTxHash(null);
		setExecutionError(null);
		execute({ transaction: transactionToExecute });
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold text-black">Transaction Queue</h1>
			<p className="text-sm text-gray-600">Safe: {safeAddress}</p>

			<Link to="/config" search={{ safe: safeAddress }} className="text-black hover:underline">
				← Back to Configuration
			</Link>

			{queueError && <p className="text-red-600">Error loading queue: {queueError.message}</p>}
			{isLoadingQueue && <p className="text-gray-600">Loading transaction queue…</p>}

			{!isLoadingQueue && !queueError && queue && (
				<div className="space-y-8">
					{queue.length === 0 && (
						<p className="text-gray-600">
							No transactions found in the queue for the next 5 nonces from known signers.
						</p>
					)}
					{queue.map((nonceGroup: NonceGroup) => (
						<div key={nonceGroup.nonce.toString()} className="p-4 border border-gray-200 rounded-md shadow-sm bg-white">
							<h2 className="text-xl font-semibold text-black mb-3">Nonce: {nonceGroup.nonce.toString()}</h2>
							{nonceGroup.transactions.length === 0 && (
								<p className="text-sm text-gray-500">No transactions for this nonce.</p>
							)}
							<div className="space-y-4">
								{nonceGroup.transactions.map((txWithSigs) => {
									const canExecute = txWithSigs.signatures.length >= Number.parseInt(safeConfig.threshold);
									const isLoadingThisTx = isExecutionPending && executingTxHash === txWithSigs.safeTxHash;
									const errorForThisTx = executionError && executingTxHash === txWithSigs.safeTxHash;
									const successForThisTx = executionSuccessTxHash === txWithSigs.safeTxHash;

									return (
										<div key={txWithSigs.safeTxHash} className="p-3 border border-gray-100 rounded bg-gray-50">
											<h3 className="text-lg font-medium text-gray-800">
												Transaction (TxHash: {txWithSigs.safeTxHash.substring(0, 10)}...)
											</h3>
											<p className="text-xs text-gray-500 break-all mb-1">Full TxHash: {txWithSigs.safeTxHash}</p>
											<div className="text-sm text-gray-700 space-y-1">
												<p>
													<strong>To:</strong> {txWithSigs.details.to}
												</p>
												<p>
													<strong>Value:</strong> {txWithSigs.details.value.toString()} wei
												</p>
												<p>
													<strong>Data:</strong>{" "}
													{txWithSigs.details.data === "0x" || txWithSigs.details.data === ""
														? "0x (No data)"
														: txWithSigs.details.data}
												</p>
												<p>
													<strong>Operation:</strong> {txWithSigs.details.operation === 0 ? "CALL" : "DELEGATECALL"}
												</p>
											</div>
											<div className="mt-2">
												<h4 className="text-md font-medium text-gray-700">
													Signatures ({txWithSigs.signatures.length} / {safeConfig.threshold}):
												</h4>
												{txWithSigs.signatures.length === 0 && (
													<p className="text-xs text-gray-500">No signatures from known owners yet.</p>
												)}
												<ul className="list-disc list-inside pl-4 text-xs text-gray-600">
													{txWithSigs.signatures.map((sig) => (
														<li key={sig.signer + sig.r + sig.vs} className="break-all">
															Signer: {sig.signer} (r: {sig.r.substring(0, 10)}..., vs: {sig.vs.substring(0, 10)}...)
														</li>
													))}
												</ul>
											</div>

											<div className="mt-3">
												{canExecute && !successForThisTx && (
													<button
														type="button"
														onClick={() => handleExecuteTransaction(txWithSigs)}
														disabled={isLoadingThisTx || isExecutionPending}
														className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
													>
														{isLoadingThisTx ? "Executing..." : "Execute Transaction"}
													</button>
												)}
												{!canExecute && (
													<p className="text-xs text-yellow-600">
														Needs {Number.parseInt(safeConfig.threshold) - txWithSigs.signatures.length} more
														signature(s) to execute.
													</p>
												)}
												{isLoadingThisTx && (
													<p className="text-sm text-gray-600 mt-1">Submitting transaction to wallet...</p>
												)}
												{errorForThisTx && (
													<p className="text-sm text-red-600 mt-1">Execution failed: {executionError?.message}</p>
												)}
												{successForThisTx && (
													<p className="text-sm text-green-600 mt-1">
														Transaction successfully submitted! Monitor your wallet for confirmation.
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function QueuePage() {
	const { safe: safeAddress } = Route.useSearch();
	return (
		<RequireWallet>
			<QueuePageInner safeAddress={safeAddress} />
		</RequireWallet>
	);
}

function QueuePageInner({ safeAddress }: { safeAddress: string }) {
	const provider = useWalletProvider();
	const {
		data: safeConfig,
		isLoading: isLoadingConfig,
		error: configError,
	} = useSafeConfiguration(provider, safeAddress);

	if (isLoadingConfig) {
		return <p className="text-center p-6 text-gray-600">Loading Safe configuration…</p>;
	}

	if (configError) {
		return <p className="text-center p-6 text-red-600">Error loading Safe configuration: {configError.message}</p>;
	}

	if (!safeConfig) {
		return <p className="text-center p-6 text-gray-600">Safe configuration not available.</p>;
	}

	return <QueueContent provider={provider} safeAddress={safeAddress} safeConfig={safeConfig} />;
}
