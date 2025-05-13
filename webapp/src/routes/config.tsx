import { Link, createFileRoute } from "@tanstack/react-router";
import { useConnectWallet } from "@web3-onboard/react";
import { useBrowserProvider } from "../hooks/useBrowserProvider";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import type { JsonRpcApiProvider } from "ethers";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";

interface ConfigContentProps {
  provider: JsonRpcApiProvider;
  safeAddress: string;
}

function ConfigContent({ provider, safeAddress }: ConfigContentProps) {
  const { data, isLoading, error } = useSafeConfiguration(
    provider,
    safeAddress,
  );

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

function ConfigPage() {
  const { safe: safeAddress } = Route.useSearch();
  const [{ wallet: primaryWallet }, connect] = useConnectWallet();
  const provider = useBrowserProvider();

  if (!primaryWallet) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
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
    return <p className="text-center p-6">Initializing provider…</p>;
  }

  return <ConfigContent provider={provider} safeAddress={safeAddress} />;
}
