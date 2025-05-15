interface HarbourSignature {
	r: string;
	vs: string;
	txHash: string;
	signer: string;
}

interface HarbourTransactionDetails {
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

export type { HarbourSignature, HarbourTransactionDetails };
