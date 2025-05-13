import type { SafeConfiguration } from "@/lib/safe";
import { getSafeConfiguration } from "@/lib/safe";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { JsonRpcApiProvider } from "ethers";
import { useChainId } from "./useChainId";

export function useSafeConfiguration(
  provider: JsonRpcApiProvider,
  safeAddress: string,
  options?: Parameters<typeof getSafeConfiguration>[2],
): UseQueryResult<SafeConfiguration, Error> {
  const { data: chainId } = useChainId(provider);

  return useQuery<SafeConfiguration, Error>({
    queryKey: ["safeConfig", chainId, safeAddress],
    queryFn: async () => {
      const result = await getSafeConfiguration(provider, safeAddress, options);
      return result;
    },
    enabled: Boolean(provider && chainId && safeAddress),
    retry: false,
  });
}
