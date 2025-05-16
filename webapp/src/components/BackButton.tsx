import { Link } from "@tanstack/react-router";

interface BackButtonProps {
	to: string;
	search?: Record<string, string | number>;
	children: React.ReactNode;
	className?: string;
}

export function BackButton({ to, search, children, className = "" }: BackButtonProps) {
	return (
		<Link to={to} search={search} className={`inline-flex items-center text-black hover:underline ${className}`}>
			← {children}
		</Link>
	);
}

export function BackToDashboardButton({ safeAddress, chainId }: { safeAddress: string; chainId: string }) {
	return (
		<BackButton to="/dashboard" search={{ safe: safeAddress, chainId }}>
			Back to Dashboard
		</BackButton>
	);
}
