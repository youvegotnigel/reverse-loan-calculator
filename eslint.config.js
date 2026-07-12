import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/.expo', 'apps/mobile/android', 'apps/mobile/ios'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);
