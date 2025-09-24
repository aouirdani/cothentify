module.exports = {
  root: false,
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['app/api/**/*.{ts,tsx}', 'lib/auth.ts', 'app/checkout/start/route.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-empty': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
