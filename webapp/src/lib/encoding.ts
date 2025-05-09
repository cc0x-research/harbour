import { ethers } from "ethers";

function getChecksummedAddress(address: string): string {
	return ethers.getAddress(address);
}

function bytes32ToAddress(bytes32: string, opts: { checksum: boolean } = { checksum: true }): string {
	if (bytes32.length !== 66) {
		throw new Error("Invalid bytes32 length");
	}

	const sliceStart = bytes32.startsWith("0x") ? 26 : 24;
	if (opts.checksum) {
		return ethers.getAddress(`0x${bytes32.slice(sliceStart)}`);
	}

	return `0x${bytes32.slice(sliceStart)}`;
}

export { bytes32ToAddress, getChecksummedAddress };
