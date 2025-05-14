import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import type { JsonRpcApiProvider } from "ethers";
import { z } from "zod";
import { RequireWallet } from "../components/RequireWallet";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";

interface ConfigContentProps {
	provider: JsonRpcApiProvider;
	safeAddress: string;
}

function ConfigContent({ provider, safeAddress }: ConfigContentProps) {
	const { data, isLoading, error } = useSafeConfiguration(provider, safeAddress);

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6">
			<Link to="/" className="text-black hover:underline">
				← Back
			</Link>
			{isLoading && <p className="text-gray-600">Loading configuration…</p>}
			{error && <p className="text-red-600">Error: {error.message}</p>}
			{data && <SafeConfigDisplay config={data} />}
			{data && (
				<Link
					to="/enqueue"
					search={{ safe: safeAddress }}
					className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
				>
					Enqueue Transaction
				</Link>
			)}
		</div>
	);
}

// Define a Zod schema for search params
const configSearchSchema = z.object({
	safe: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
});

export const Route = createFileRoute("/config")({
	validateSearch: zodValidator(configSearchSchema),
	component: ConfigPage,
});

export function ConfigPage() {
	const { safe: safeAddress } = Route.useSearch();
	return <RequireWallet>{(provider) => <ConfigContent provider={provider} safeAddress={safeAddress} />}</RequireWallet>;
}
