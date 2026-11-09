import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Restore browser-local state after the static HTML has hydrated.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
