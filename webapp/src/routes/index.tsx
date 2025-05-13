import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConnectWallet } from "@web3-onboard/react";
import SafeConfigForm from "../components/SafeConfigForm";

export function App() {
	const [{ wallet: primaryWallet }, connect] = useConnectWallet();
	const navigate = useNavigate();

	const handleConnectWallet = async () => {
		await connect();
	};
	const handleSubmit = (safe: string) => {
		navigate({ to: "/config", search: { safe } });
	};

	return (
		<div className="max-w-3xl mx-auto p-6">
			{!primaryWallet ? (
				<button
					type="button"
					onClick={handleConnectWallet}
					className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
				>
					Connect Wallet
				</button>
			) : (
				<SafeConfigForm onSubmit={handleSubmit} />
			)}
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: App,
});
