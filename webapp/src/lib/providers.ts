import type { JsonRpcApiProvider, Eip1193Provider } from "ethers";

function getEIP1193ProviderFromRPCProvider(
	browserProvider: JsonRpcApiProvider,
): Eip1193Provider {
	return {
		request: async ({ params, method }) =>
			await browserProvider.send(method, params || []),
	};
}

export { getEIP1193ProviderFromRPCProvider };
