import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";

// Define a Zod schema for search params
const configSearchSchema = z.object({
	rpcUrl: z.string().url("Invalid RPC URL"),
	safe: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
});

export const Route = createFileRoute("/config")({
	validateSearch: zodValidator(configSearchSchema),
	component: ConfigPage,
});

function ConfigPage() {
	// Read validated RPC URL and Safe address from search params
	const { rpcUrl, safe: safeAddress } = Route.useSearch();

	const { data, isLoading, error } = useSafeConfiguration(rpcUrl, safeAddress);

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6">
			<Link to="/" search={{ rpcUrl }} className="text-black hover:underline">
				← Back
			</Link>
			{isLoading && <p className="text-gray-600">Loading configuration…</p>}
			{error && <p className="text-red-600">Error: {error.message}</p>}
			{data && <SafeConfigDisplay config={data} />}
			{data && (
				<Link
					to="/enqueue"
					search={{ rpcUrl, safe: safeAddress }}
					className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
				>
					Enqueue Transaction
				</Link>
			)}
		</div>
	);
}
