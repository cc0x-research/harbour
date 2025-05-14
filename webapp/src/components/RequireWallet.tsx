import { useConnectWallet } from "@web3-onboard/react";

interface RequireWalletProps {
	children: React.ReactNode;
}

export function RequireWallet({ children }: RequireWalletProps) {
	const [{ wallet }, connect] = useConnectWallet();

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

	return <>{children}</>;
}
