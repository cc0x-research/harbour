enum Operation {
	CALL = 0,
	DELEGATE = 1,
}

interface HarbourSignature {
	r: string;
	vs: string;
	txHash: string;
	signer: string;
}

interface SafeTransaction {
	operation: Operation;
	to: string;
	value: string;
	safeTxGas: string;
	baseGas: string;
	gasPrice: string;
	gasToken: string;
	refundReceiver: string;
	data: string;
}

interface HarbourTransactionDetails extends SafeTransaction {
	stored: boolean;
}

interface FullSafeTransaction extends SafeTransaction {
	nonce: string;
	chainId: string;
	safeAddress: string;
}

export type { HarbourSignature, HarbourTransactionDetails, FullSafeTransaction };
