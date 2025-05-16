import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireWallet } from "../components/RequireWallet";
import SafeAddressForm from "../components/SafeAddressForm";

export function App() {
	// Wallet connection only
	return (
		<RequireWallet>
			<AppInner />
		</RequireWallet>
	);
}

function AppInner() {
	const navigate = useNavigate();
	const handleSubmit = (safe: string) => {
		navigate({ to: "/dashboard", search: { safe } });
	};
	return (
		<div className="max-w-3xl mx-auto p-6">
			<SafeAddressForm onSubmit={handleSubmit} />
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: App,
});
