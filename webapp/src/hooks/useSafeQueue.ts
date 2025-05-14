import { HARBOUR_ABI, HARBOUR_ADDRESS } from "@/lib/safe";
import type { SafeConfiguration } from "@/lib/safe";
import { useQuery } from "@tanstack/react-query";
import { type BrowserProvider, Contract } from "ethers";

// Data structures for the queue
export interface FetchedSignature {
	r: string;
	vs: string;
	txHash: string;
	signer: string;
}

export interface FetchedTransactionDetails {
	to: string;
	value: bigint;
	data: string;
	operation: number;
	// other fields from SafeTransaction struct if needed for display
	stored: boolean; // To ensure we only process stored transactions
}

export interface TransactionWithSignatures {
	details: FetchedTransactionDetails;
	signatures: FetchedSignature[];
	safeTxHash: string;
}

export interface NonceGroup {
	nonce: bigint;
	transactions: TransactionWithSignatures[];
}

interface UseSafeQueueProps {
	provider: BrowserProvider | undefined;
	safeAddress: string;
	safeConfig: SafeConfiguration | undefined; // from useSafeConfiguration
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
			bigint | undefined, // currentNonce from safeConfig
			string[] | undefined, // owners from safeConfig
			number, // maxNoncesToFetch
		]
	>({
		queryKey: ["safeQueue", safeAddress, safeConfig?.nonce, safeConfig?.owners, maxNoncesToFetch],
		queryFn: async () => {
			if (!provider || !safeConfig) {
				throw new Error("Provider or Safe configuration is not available.");
			}

			const harbourContract = new Contract(HARBOUR_ADDRESS, HARBOUR_ABI, provider);
			const fetchedNonceGroups: NonceGroup[] = [];
			const currentNonce = safeConfig.nonce;
			const owners = safeConfig.owners;
			const network = await provider.getNetwork();
			const chainId = network.chainId;

			for (let i = 0; i < maxNoncesToFetch; i++) {
				const targetNonce = currentNonce + BigInt(i);
				const nonceGroup: NonceGroup = { nonce: targetNonce, transactions: [] };
				const transactionsForNonceMap = new Map<string, TransactionWithSignatures>();

				for (const ownerAddress of owners) {
					const [signaturesPage] = await harbourContract.retrieveSignatures(
						ownerAddress,
						safeAddress,
						chainId,
						targetNonce,
						0, // start
						100, // count, assuming max 100 sigs per owner/nonce
					);

					for (const sig of signaturesPage) {
						const safeTxHash = sig.txHash;
						let txWithSigs = transactionsForNonceMap.get(safeTxHash);

						if (!txWithSigs) {
							const txDetailsFromContract = await harbourContract.retrieveTransaction(safeTxHash);

							if (txDetailsFromContract.stored) {
								const fetchedTxDetails: FetchedTransactionDetails = {
									to: txDetailsFromContract.to,
									value: BigInt(txDetailsFromContract.value.toString()),
									data: txDetailsFromContract.data,
									operation: Number(txDetailsFromContract.operation),
									stored: txDetailsFromContract.stored,
								};
								txWithSigs = {
									details: fetchedTxDetails,
									signatures: [],
									safeTxHash: safeTxHash,
								};
								transactionsForNonceMap.set(safeTxHash, txWithSigs);
								nonceGroup.transactions.push(txWithSigs);
							}
						}

						if (txWithSigs) {
							txWithSigs.signatures.push({
								r: sig.r,
								vs: sig.vs,
								txHash: sig.txHash,
								signer: ownerAddress,
							});
						}
					}
				}
				if (nonceGroup.transactions.length > 0) {
					fetchedNonceGroups.push(nonceGroup);
				}
			}
			return fetchedNonceGroups;
		},
		enabled: !!provider && !!safeConfig && !!safeConfig.nonce && !!safeConfig.owners?.length,
		staleTime: 15 * 1000, // Refetch data considered stale after 15 seconds
		refetchInterval: 30 * 1000, // Optionally refetch every 30 seconds
	});
}
