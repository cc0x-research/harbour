import { createContext, useContext } from "react";
import { useConnectWallet } from "@web3-onboard/react";
import type { BrowserProvider } from "ethers";
import { useBrowserProvider } from "../hooks/useBrowserProvider";

// Create context for the initialized BrowserProvider
const WalletContext = createContext<BrowserProvider | null>(null);

interface RequireWalletProps {
	children: React.ReactNode;
}

export function RequireWallet({ children }: RequireWalletProps) {
	const [{ wallet }, connect] = useConnectWallet();
	const provider = useBrowserProvider();

	// Prompt to connect wallet
	if (!wallet) {
		return (
			<div className="max-w-3xl mx-auto p-6 text-center">
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

	// Wait for provider initialization
	if (!provider) {
		return <p className="text-center p-6 text-gray-600">Initializing provider…</p>;
	}

	// Provide the ready provider via context
	return <WalletContext.Provider value={provider}>{children}</WalletContext.Provider>;
}

/**
 * Hook to access the BrowserProvider from context.
 * Must be used within a RequireWallet tree.
 */
export function useWalletProvider(): BrowserProvider {
	const provider = useContext(WalletContext);
	if (!provider) {
		throw new Error("useWalletProvider must be used within RequireWallet");
	}
	return provider;
}
