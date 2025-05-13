import { Link, createFileRoute } from "@tanstack/react-router";
import { useConnectWallet } from "@web3-onboard/react";
import { BrowserProvider } from "ethers";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";

// Define a Zod schema for search params
const configSearchSchema = z.object({
  safe: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
});

export const Route = createFileRoute("/config")({
  validateSearch: zodValidator(configSearchSchema),
  component: ConfigPage,
});

function ConfigPage() {
  // Read validated Safe address from search params
  const { safe: safeAddress } = Route.useSearch();
  const [{ wallet: primaryWallet }, connect] = useConnectWallet();

  const provider = new BrowserProvider(primaryWallet.provider);
  const { data, isLoading, error } = useSafeConfiguration(
    provider,
    safeAddress,
  );

  if (!primaryWallet) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <button
          type="button"
          onClick={async () => await connect()}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

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
