module.exports = {
  root: true,
  extends: ['noftalint/typescript'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'deprecation'],
  ignorePatterns: ['node_modules/', 'dist/'],
  reportUnusedDisableDirectives: true,
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    'deprecation/deprecation': 'warn',

    // It cannot resolve TypeScript's path aliases. See https://github.com/mysticatea/eslint-plugin-node/issues/233
    'node/no-missing-import': 'off',

    // We don't necessarily want to use `this` in our class methods (such as `Command#run`),
    // but neither do we want them to be static.
    'class-methods-use-this': 'off',

    'no-await-in-loop': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  overrides: [
    {
      files: './src/lib/decorators/**.ts',
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/naming-convention': [
          ...require('eslint-config-noftalint/rules/typescript').rules['@typescript-eslint/naming-convention'],
          {
            selector: 'function',
            modifiers: ['exported'],
            format: ['PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          {
            selector: 'function',
            modifiers: ['global'],
            format: ['camelCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
        ],
      },
    },
  ],
  globals: {
    PromiseRejectedResult: 'readonly',
    PromiseSettledResult: 'readonly',
    PromiseFulfilledResult: 'readonly',
  },
};
