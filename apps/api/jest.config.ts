import type { Config } from "jest";

const config: Config = {
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "<rootDir>/tsconfig.json",
			},
		],
	},
	extensionsToTreatAsEsm: [".ts"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};

export default config;
