import { useConnectWallet } from "@web3-onboard/react";
import type { BrowserProvider } from "ethers";
import { useBrowserProvider } from "../hooks/useBrowserProvider";

interface RequireWalletProps {
	children: (provider: BrowserProvider) => React.ReactNode;
}

export function RequireWallet({ children }: RequireWalletProps) {
	const [{ wallet }, connect] = useConnectWallet();
	const provider = useBrowserProvider();

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

	if (!provider) {
		return <p className="text-center p-6">Initializing provider…</p>;
	}

	return <>{children(provider)}</>;
}
