import { useBrowserProvider } from "@/hooks/useBrowserProvider";
import { useSafeConfiguration } from "@/hooks/useSafeConfiguration";
import { type NonceGroup, useSafeQueue } from "@/hooks/useSafeQueue";
import type { SafeConfiguration } from "@/lib/safe";
import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useConnectWallet } from "@web3-onboard/react";
import type { BrowserProvider } from "ethers";
import { z } from "zod";

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
								{nonceGroup.transactions.map((txWithSigs) => (
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
									</div>
								))}
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
	const [{ wallet: primaryWallet }, connect] = useConnectWallet();
	const provider = useBrowserProvider();

	// Fetch Safe configuration first
	if (!primaryWallet) {
		return (
			<div className="max-w-3xl mx-auto p-6 space-y-6 text-center">
				<h1 className="text-xl font-semibold text-black mb-4">View Transaction Queue</h1>
				<p className="mb-4 text-gray-600">Please connect your wallet to view the transaction queue for the Safe.</p>
				<button
					type="button"
					onClick={() => connect()}
					className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
				>
					Connect Wallet
				</button>
			</div>
		);
	}

	if (!provider) {
		return <p className="text-center p-6 text-gray-600">Initializing provider…</p>;
	}

	// At this point, provider is defined.
	const {
		data: safeConfig,
		isLoading: isLoadingConfig,
		error: configError,
	} = useSafeConfiguration(provider, safeAddress); // Added non-null assertion for provider

	if (isLoadingConfig) {
		return <p className="text-center p-6 text-gray-600">Loading Safe configuration…</p>;
	}

	if (configError) {
		return <p className="text-center p-6 text-red-600">Error loading Safe configuration: {configError.message}</p>;
	}

	if (!safeConfig) {
		return <p className="text-center p-6 text-gray-600">Safe configuration not available.</p>;
	}

	return <QueueContent provider={provider} safeAddress={safeAddress} safeConfig={safeConfig} />; // Added non-null assertion for provider
}
