import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { type BrowserProvider, Contract, isAddress, parseEther } from "ethers";
import { useEffect, useState } from "react";
import { z } from "zod";
import { RequireWallet, useWalletProvider } from "../components/RequireWallet";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";
import { HARBOUR_ABI, HARBOUR_ADDRESS } from "../lib/safe";

// Zero address constant
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Define the route before the component so Route is in scope
export const Route = createFileRoute("/enqueue")({
	validateSearch: zodValidator(
		z.object({
			safe: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
		}),
	),
	component: EnqueuePage,
});

interface EnqueueContentProps {
	provider: BrowserProvider;
	safeAddress: string;
}

function EnqueueContent({ provider, safeAddress }: EnqueueContentProps) {
	const {
		data: configResult,
		isLoading: isLoadingConfig,
		error: configError,
	} = useSafeConfiguration(provider, safeAddress);

	const [to, setTo] = useState("");
	const [value, setValue] = useState("");
	const [dataInput, setDataInput] = useState("");
	const [nonce, setNonce] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [txHash, setTxHash] = useState<string>();
	const [error, setError] = useState<string>();

	const isToValid = to === "" ? false : isAddress(to);
	const isValueValid = value === "" || !Number.isNaN(Number(value));
	const isNonceValid = nonce === "" || !Number.isNaN(Number(nonce));

	useEffect(() => {
		if (configResult) {
			setNonce(configResult.nonce.toString());
		}
	}, [configResult]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(undefined);

		try {
			setIsSubmitting(true);
			const network = await provider.getNetwork();
			const chainId = network.chainId;
			const domain = { chainId, verifyingContract: safeAddress };
			const types = {
				SafeTx: [
					{ name: "to", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "data", type: "bytes" },
					{ name: "operation", type: "uint8" },
					{ name: "safeTxGas", type: "uint256" },
					{ name: "baseGas", type: "uint256" },
					{ name: "gasPrice", type: "uint256" },
					{ name: "gasToken", type: "address" },
					{ name: "refundReceiver", type: "address" },
					{ name: "nonce", type: "uint256" },
				],
			};
			const txNonce = nonce !== "" ? BigInt(nonce) : (configResult?.nonce ?? BigInt(0));
			const message = {
				to,
				value: parseEther(value || "0"),
				data: dataInput,
				operation: 0,
				safeTxGas: 0,
				baseGas: 0,
				gasPrice: 0,
				gasToken: ZERO_ADDRESS,
				refundReceiver: ZERO_ADDRESS,
				nonce: txNonce,
			};

			const signer = await provider.getSigner();
			const signature: string = await signer.signTypedData(domain, types, message);
			const harbourContract = new Contract(HARBOUR_ADDRESS, HARBOUR_ABI, signer);
			const tx = await harbourContract.enqueueTransaction(
				safeAddress,
				chainId,
				txNonce,
				to,
				parseEther(value || "0"),
				dataInput,
				0,
				0,
				0,
				0,
				ZERO_ADDRESS,
				ZERO_ADDRESS,
				signature,
			);
			const receipt = await tx.wait();
			setTxHash(receipt.transactionHash);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Transaction failed";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold text-black">Enqueue Transaction</h1>
			<p className="text-sm text-gray-600">Safe: {safeAddress}</p>

			<Link to="/config" search={{ safe: safeAddress }} className="text-black hover:underline">
				← Back
			</Link>

			{configError && <p className="text-red-600">Error: {configError.message}</p>}
			{isLoadingConfig && <p className="text-gray-600">Loading Safe configuration…</p>}

			{!isLoadingConfig && !configError && (
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label htmlFor="to" className="block font-medium text-black">
							To
						</label>
						<input
							id="to"
							type="text"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							placeholder="0x..."
							className="mt-1 block w-full border border-gray-200 bg-white text-black placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
						/>
					</div>

					<div>
						<label htmlFor="value" className="block font-medium text-black">
							Value (ETH)
						</label>
						<input
							id="value"
							type="text"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="0.0"
							className="mt-1 block w-full border border-gray-200 bg-white text-black placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
						/>
					</div>

					<div>
						<label htmlFor="data" className="block font-medium text-black">
							Data (0x...)
						</label>
						<input
							id="data"
							type="text"
							value={dataInput}
							onChange={(e) => setDataInput(e.target.value)}
							placeholder="0x..."
							className="mt-1 block w-full border border-gray-200 bg-white text-black placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
						/>
					</div>

					<div>
						<label htmlFor="nonce" className="block font-medium text-black">
							Nonce
						</label>
						<input
							id="nonce"
							type="number"
							value={nonce}
							onChange={(e) => setNonce(e.target.value)}
							className="mt-1 block w-full border border-gray-200 bg-white text-black placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
						/>
						<p className="text-sm text-gray-500">Leave blank to use current nonce {configResult?.nonce.toString()}</p>
						{nonce !== "" && !isNonceValid && <p className="text-red-600">Invalid nonce</p>}
					</div>

					<button
						type="submit"
						disabled={isSubmitting || !isToValid || !isValueValid || !isNonceValid}
						className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition"
						title={
							!isToValid
								? "Invalid 'To' address"
								: !isValueValid
									? "Invalid value"
									: !isNonceValid
										? "Invalid nonce"
										: undefined
						}
					>
						{isSubmitting ? "Sending…" : "Sign & Enqueue"}
					</button>

					{txHash && <p className="text-gray-900">Transaction Hash: {txHash}</p>}
					{error && <p className="text-red-600">Error: {error}</p>}
				</form>
			)}
		</div>
	);
}

export function EnqueuePage() {
	const { safe: safeAddress } = Route.useSearch();
	return (
		<RequireWallet>
			<EnqueuePageInner safeAddress={safeAddress} />
		</RequireWallet>
	);
}

function EnqueuePageInner({ safeAddress }: { safeAddress: string }) {
	const provider = useWalletProvider();
	return <EnqueueContent provider={provider} safeAddress={safeAddress} />;
}
