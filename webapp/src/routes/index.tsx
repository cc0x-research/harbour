import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireWallet } from "../components/RequireWallet";
import SafeConfigForm from "../components/SafeConfigForm";

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
		navigate({ to: "/config", search: { safe } });
	};
	return (
		<div className="max-w-3xl mx-auto p-6">
			<SafeConfigForm onSubmit={handleSubmit} />
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: App,
});
