import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        Scratch: 'readonly'
      }
    }
  },
  {
    // The browser tests drive the untyped VM through the page.
    files: ['tests/browser/**/*.ts', 'tests/*.browser.ts'],
    rules: {'@typescript-eslint/no-explicit-any': 'off'}
  }
);
