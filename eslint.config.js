const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends("expo"),
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
