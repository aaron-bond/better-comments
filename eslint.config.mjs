// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Lints the TypeScript in src/ and test/, with type information from their tsconfigs
export default defineConfig(
    globalIgnores(['out/', '.vscode-test/', '.perf/', 'coverage/', 'build/', 'test/fixtures/', '**/*.js', '**/*.mjs']),
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json', './test/tsconfig.json', './test/tsconfig.node.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Carried over from tslint.json
            curly: ['error', 'multi-line'],
            eqeqeq: 'error',
            '@typescript-eslint/naming-convention': ['error', { selector: 'class', format: ['PascalCase'] }],
            // A double cast asserts a type without checking it: narrow the value instead
            'no-restricted-syntax': ['error', {
                selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
                message: '`as unknown as` asserts a type without checking it. Narrow the value instead.',
            }],
        },
    },
);
