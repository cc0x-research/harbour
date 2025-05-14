import { ethers } from "ethers";
import { bytes32ToAddress } from "./encoding";
import { aggregateMulticall } from "./multicall";

const HARBOUR_ADDRESS = "0x5E669c1f2F9629B22dd05FBff63313a49f87D4e6";

const HARBOUR_ABI = [
	"function enqueueTransaction(address safeAddress, uint256 chainId, uint256 nonce, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signature) external",
];

interface SafeConfiguration {
	owners: string[];
	threshold: bigint;
	fallbackHandler: string;
	nonce: bigint;
	modules: string[];
	guard: string;
	singleton: string;
}

const SAFE_ABI = [
	"function getOwners() view returns (address[])",
	"function getThreshold() view returns (uint256)",
	"function nonce() view returns (uint256)",
	"function getModulesPaginated(address start, uint256 pageSize) view returns (address[] modules, address next)",
	"function getStorageAt(uint256 offset, uint256 length) view returns (bytes)",
];
const SAFE_INTERFACE = new ethers.Interface(SAFE_ABI);

const FALLBACK_SLOT = "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5";
const GUARD_SLOT = "0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8";
const SINGLETON_SLOT = ethers.zeroPadBytes(ethers.toBeHex(0), 32);
const SENTINEL = "0x0000000000000000000000000000000000000001";

async function getSafeConfiguration(
	provider: ethers.JsonRpcApiProvider,
	safeAddress: string,
	options: { modulePageSize: number } = { modulePageSize: 50 },
): Promise<SafeConfiguration> {
	const calls = [
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getOwners"),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getThreshold"),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getStorageAt", [FALLBACK_SLOT, 1]),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("nonce"),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getStorageAt", [GUARD_SLOT, 1]),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getStorageAt", [SINGLETON_SLOT, 1]),
		},
		{
			target: safeAddress,
			callData: SAFE_INTERFACE.encodeFunctionData("getModulesPaginated", [SENTINEL, options.modulePageSize]),
		},
	];
	const results = await aggregateMulticall(provider, calls);
	const configuration: SafeConfiguration = {
		owners: SAFE_INTERFACE.decodeFunctionResult("getOwners", results[0].returnData)[0],
		threshold: SAFE_INTERFACE.decodeFunctionResult("getThreshold", results[1].returnData)[0],
		fallbackHandler: bytes32ToAddress(SAFE_INTERFACE.decodeFunctionResult("getStorageAt", results[2].returnData)[0]),
		nonce: SAFE_INTERFACE.decodeFunctionResult("nonce", results[3].returnData)[0],
		guard: bytes32ToAddress(SAFE_INTERFACE.decodeFunctionResult("getStorageAt", results[4].returnData)[0]),
		singleton: bytes32ToAddress(SAFE_INTERFACE.decodeFunctionResult("getStorageAt", results[5].returnData)[0]),
		modules: SAFE_INTERFACE.decodeFunctionResult("getModulesPaginated", results[6].returnData)[0],
	};

	return configuration;
}

export { HARBOUR_ADDRESS, HARBOUR_ABI, getSafeConfiguration };
export type { SafeConfiguration };
