import { BackButton } from "@/components/BackButton";
import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import type { BrowserProvider } from "ethers";
import { ArrowUpRight, PlusCircle, ScrollText } from "lucide-react";
import { z } from "zod";
import { RequireWallet, useWalletProvider } from "../components/RequireWallet";
import SafeConfigDisplay from "../components/SafeConfigDisplay";
import { useSafeConfiguration } from "../hooks/useSafeConfiguration";
import { safeAddressSchema } from "../lib/validators";

interface DashboardContentProps {
	provider: BrowserProvider;
	safeAddress: string;
}

const ActionCard = ({
	title,
	description,
	icon: Icon,
	ctaText,
	to,
	search,
}: {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	ctaText: string;
	to: string;
	search: { safe: string };
}) => (
	<div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
		<div className="flex items-center gap-3 mb-4">
			<div className="p-2 bg-gray-100 rounded-full">
				<Icon className="w-5 h-5 text-gray-700" />
			</div>
			<h3 className="text-lg font-medium text-gray-900">{title}</h3>
		</div>
		<p className="text-gray-600 mb-6">{description}</p>
		<Link
			to={to}
			search={search}
			className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
		>
			{ctaText}
			<ArrowUpRight className="w-4 h-4" />
		</Link>
	</div>
);

function DashboardContent({ provider, safeAddress }: DashboardContentProps) {
	const { data: config, isLoading, error } = useSafeConfiguration(provider, safeAddress);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-5xl mx-auto p-6 space-y-8">
				<div>
					<BackButton to="/">Back to home</BackButton>
					<h1 className="text-3xl font-bold text-gray-900">Safe Dashboard</h1>
					<p className="text-gray-600">Manage your Safe and execute transactions</p>
				</div>

				{isLoading && <p className="text-gray-600">Loading configuration…</p>}
				{error && <p className="text-red-600">Error: {error.message}</p>}

				{config && (
					<>
						<div className="grid md:grid-cols-2 gap-6">
							<ActionCard
								title="Transaction Queue"
								description="View and execute pending transactions that are ready to be executed."
								icon={ScrollText}
								ctaText="View Queue"
								to="/queue"
								search={{ safe: safeAddress }}
							/>
							<ActionCard
								title="New Transaction"
								description="Create and enqueue a new transaction for your Safe."
								icon={PlusCircle}
								ctaText="Create Transaction"
								to="/enqueue"
								search={{ safe: safeAddress }}
							/>
						</div>

						<div className="mt-10">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Safe Configuration</h2>
							<div className="bg-white p-6 border border-gray-200 rounded-lg">
								<SafeConfigDisplay config={config} />
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

const configSearchSchema = z.object({
	safe: safeAddressSchema,
});

export const Route = createFileRoute("/dashboard")({
	validateSearch: zodValidator(configSearchSchema),
	component: DashboardPage,
});

export function DashboardPage() {
	const { safe: safeAddress } = Route.useSearch();
	return (
		<RequireWallet>
			<DashboardPageInner safeAddress={safeAddress} />
		</RequireWallet>
	);
}

function DashboardPageInner({ safeAddress }: { safeAddress: string }) {
	const provider = useWalletProvider();
	return <DashboardContent provider={provider} safeAddress={safeAddress} />;
}
