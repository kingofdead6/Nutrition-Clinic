import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * RTL guard: physical-direction Tailwind utilities break the mirrored layout.
 * Use ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/rounded-s… instead.
 */
const PHYSICAL_CLASS =
  '(^|\\s|:)-?(ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-|(^|\\s|:)(text-left|text-right|float-left|float-right|clear-left|clear-right|border-l|border-r|rounded-l|rounded-r)(\\s|$)';
const rtlMessage =
  'Use logical Tailwind utilities (ms/me/ps/pe/start/end/text-start…) instead of left/right ones (RTL).';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'data/**',
      'apps/server/data/**',
      // Generated from apps/client/src/shared (npm run sync:shared).
      'apps/server/src/shared/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    files: ['apps/server/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Only the Mongo driver may talk to Mongoose.
    files: ['apps/server/**/*.js'],
    ignores: ['apps/server/src/repositories/mongo/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'mongoose', message: 'Only src/repositories/mongo/ may import mongoose.' },
            { name: 'mongodb', message: 'Only src/repositories/mongo/ may import mongodb.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name='className'] Literal[value=/${PHYSICAL_CLASS}/]`,
          message: rtlMessage,
        },
        {
          selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=/${PHYSICAL_CLASS}/]`,
          message: rtlMessage,
        },
        {
          selector: `CallExpression[callee.name='cn'] Literal[value=/${PHYSICAL_CLASS}/]`,
          message: rtlMessage,
        },
      ],
    },
  },
);
