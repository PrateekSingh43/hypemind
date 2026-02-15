import baseConfig from "@repo/eslint-config/node";

/** @type {import("eslint").Config[]} */
export default [
  ...baseConfig,
  {
    // You can add package-specific rules here
    rules: {},
  },
];