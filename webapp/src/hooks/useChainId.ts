import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { JsonRpcApiProvider } from "ethers";

/**
 * React hook to retrieve the current chainId from a given ethers provider.
 * Uses TanStack Query for caching and async state management.
 * Returning string is preferred to avoid JSON serialization issues.
 *
 * @param provider An ethers.js JsonRpcApiProvider instance
 * @returns UseQueryResult<string, Error>
 */
export function useChainId(provider: JsonRpcApiProvider): UseQueryResult<string, Error> {
	return useQuery<string, Error>({
		queryKey: ["chainId", provider],
		queryFn: async () => {
			const network = await provider.getNetwork();
			return network.chainId.toString();
		},
		enabled: !!provider,
		retry: false,
	});
}
