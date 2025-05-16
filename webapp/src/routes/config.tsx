import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import type { BrowserProvider } from "ethers";
import { z } from "zod";
import { safeAddressSchema } from "../lib/validators";
import { RequireWallet, useWalletProvider } from "../components/RequireWallet";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";

interface ConfigContentProps {
	provider: BrowserProvider;
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

const configSearchSchema = z.object({
	safe: safeAddressSchema,
});

export const Route = createFileRoute("/config")({
	validateSearch: zodValidator(configSearchSchema),
	component: ConfigPage,
});

export function ConfigPage() {
	const { safe: safeAddress } = Route.useSearch();
	return (
		<RequireWallet>
			<ConfigPageInner safeAddress={safeAddress} />
		</RequireWallet>
	);
}

function ConfigPageInner({ safeAddress }: { safeAddress: string }) {
	const provider = useWalletProvider();
	return <ConfigContent provider={provider} safeAddress={safeAddress} />;
}
