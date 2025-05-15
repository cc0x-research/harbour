import { aggregateMulticall } from "@/lib/multicall";
import { HARBOUR_ABI, HARBOUR_ADDRESS } from "@/lib/safe";
import type { SafeConfiguration } from "@/lib/safe";
import { useQuery } from "@tanstack/react-query";
import { Interface } from "ethers";
import type { BrowserProvider, JsonRpcProvider } from "ethers";

// Data structures for the queue
export interface FetchedSignature {
	r: string;
	vs: string;
	txHash: string;
	signer: string;
}

export interface FetchedTransactionDetails {
	stored: boolean;
	operation: number;
	to: string;
	value: string;
	safeTxGas: string;
	baseGas: string;
	gasPrice: string;
	gasToken: string;
	refundReceiver: string;
	data: string;
}

export interface TransactionWithSignatures {
	details: FetchedTransactionDetails;
	signatures: FetchedSignature[];
	safeTxHash: string;
}

export interface NonceGroup {
	nonce: string;
	transactions: TransactionWithSignatures[];
}

interface UseSafeQueueProps {
	provider: BrowserProvider;
	safeAddress: string;
	safeConfig: SafeConfiguration;
	maxNoncesToFetch?: number;
}

export function useSafeQueue({ provider, safeAddress, safeConfig, maxNoncesToFetch = 5 }: UseSafeQueueProps) {
	return useQuery<
		NonceGroup[],
		Error,
		NonceGroup[],
		[
			string,
			string, // safeAddress
			string, // currentNonce from safeConfig
			string[], // owners from safeConfig
			number, // maxNoncesToFetch
		]
	>({
		queryKey: ["safeQueue", safeAddress, safeConfig.nonce, safeConfig.owners, maxNoncesToFetch],
		queryFn: async () => {
			const rpcProvider = provider as unknown as JsonRpcProvider;
			const iface = new Interface(HARBOUR_ABI);
			const { chainId } = await rpcProvider.getNetwork();
			const currentNonce = safeConfig.nonce;
			const owners = safeConfig.owners || [];
			// Batch retrieveSignatures calls
			type SigMeta = { owner: string; nonce: string };
			const sigCalls: Array<{ target: string; allowFailure: boolean; callData: string }> = [];
			const sigMeta: SigMeta[] = [];
			for (let i = 0; i < maxNoncesToFetch; i++) {
				const nonce = currentNonce + BigInt(i);
				for (const owner of owners) {
					sigCalls.push({
						target: HARBOUR_ADDRESS,
						allowFailure: false,
						callData: iface.encodeFunctionData("retrieveSignatures", [owner, safeAddress, chainId, nonce, 0, 100]),
					});
					sigMeta.push({ owner, nonce });
				}
			}
			const sigResults = await aggregateMulticall(rpcProvider, sigCalls);
			// Organize signatures per nonce and txHash
			const nonceMap = new Map<string, Map<string, FetchedSignature[]>>();
			const uniqueTxHashes = new Set<string>();
			sigResults.forEach((res, idx) => {
				const { owner, nonce } = sigMeta[idx];
				const decodedSignatures = iface.decodeFunctionResult("retrieveSignatures", res.returnData)[0];
				console.log({ decodedSignatures });

				for (const sig of decodedSignatures) {
					const signature = {
						r: sig[0],
						vs: sig[1],
						txHash: sig[2],
						signer: owner,
					};
					uniqueTxHashes.add(sig.txHash);
					let txMap = nonceMap.get(nonce);
					if (!txMap) {
						txMap = new Map();
						nonceMap.set(nonce, txMap);
					}
					const list = txMap.get(signature.txHash) ?? [];
					list.push(signature);
					txMap.set(signature.txHash, list);
				}
			});
			// Batch retrieveTransaction calls
			const txHashes = Array.from(uniqueTxHashes);
			console.log({ txHashes });
			const txCalls = txHashes.map((txHash) => ({
				target: HARBOUR_ADDRESS,
				allowFailure: false,
				callData: iface.encodeFunctionData("retrieveTransaction", [txHash]),
			}));
			const txResults = await aggregateMulticall(rpcProvider, txCalls);
			// Decode transaction details

			const txDetailsMap = new Map<string, FetchedTransactionDetails>();

			txResults.forEach((res, idx) => {
				const txHash = txHashes[idx];
				const decodedTx = iface.decodeFunctionResult("retrieveTransaction", res.returnData);
				console.log({ decodedTx });
				const [stored, operation, to, value, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, data] =
					decodedTx[0];
				console.log({ stored, operation, to, value, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, data });
				// Convert values to strings
				const valueStr = value.toString();
				const safeTxGasStr = safeTxGas.toString();
				const baseGasStr = baseGas.toString();
				const gasPriceStr = gasPrice.toString();
				txDetailsMap.set(txHash, {
					to,
					value: valueStr,
					data,
					operation,
					stored,
					safeTxGas: safeTxGasStr,
					baseGas: baseGasStr,
					gasPrice: gasPriceStr,
					gasToken,
					refundReceiver,
				});
			});
			console.log({ txDetailsMap });
			// Assemble NonceGroup array
			const result: NonceGroup[] = [];
			nonceMap.forEach((txMap, nonce) => {
				const group: NonceGroup = { nonce, transactions: [] };
				txMap.forEach((sigs, txHash) => {
					const details = txDetailsMap.get(txHash);
					if (details?.stored) {
						group.transactions.push({ details, signatures: sigs, safeTxHash: txHash });
					}
				});
				if (group.transactions.length) result.push(group);
			});
			return result;
		},
		enabled: !!provider && !!safeConfig && !!safeConfig.nonce && !!safeConfig.owners?.length,
		staleTime: 15 * 1000, // Refetch data considered stale after 15 seconds
		refetchInterval: 30 * 1000, // Optionally refetch every 30 seconds,
		throwOnError: true, // Throw error if query fails
	});
}
