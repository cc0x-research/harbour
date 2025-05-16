import { z } from "zod";

/**
 * Regular expression for Ethereum address validation
 * Matches 0x followed by exactly 40 hexadecimal characters (case-insensitive)
 */
export const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Zod schema for validating Ethereum addresses
 */
export const ethereumAddressSchema = z.string().regex(ETHEREUM_ADDRESS_REGEX, "Invalid Ethereum address");

/**
 * Zod schema for validating Safe addresses
 * Alias of ethereumAddressSchema for semantic clarity
 */
export const safeAddressSchema = ethereumAddressSchema;

/**
 * Zod schema for validating chain IDs
 * Validates that the input is a string representing a positive integer
 */
export const chainIdSchema = z.string().refine(
	(value) => {
		try {
			const num = BigInt(value);
			return num > 0 && value === num.toString();
		} catch {
			return false;
		}
	},
	{ message: "Chain ID must be a positive integer" },
);
