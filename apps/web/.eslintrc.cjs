module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules', 'vite.config.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
