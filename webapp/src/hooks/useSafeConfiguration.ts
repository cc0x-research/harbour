import type { SafeConfiguration } from "@/lib/safe";
import { getSafeConfiguration } from "@/lib/safe";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { JsonRpcProvider } from "ethers";

export function useSafeConfiguration(
	rpcUrl: string,
	safeAddress: string,
	options?: Parameters<typeof getSafeConfiguration>[2],
): UseQueryResult<SafeConfiguration, Error> {
	return useQuery<SafeConfiguration, Error>({
		queryKey: ["safeConfig", rpcUrl, safeAddress],
		queryFn: async () => {
			const provider = new JsonRpcProvider(rpcUrl);
			const result = await getSafeConfiguration(provider, safeAddress, options);
			return result;
		},
		enabled: Boolean(rpcUrl && safeAddress),
		retry: false,
	});
}
