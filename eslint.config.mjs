import typescriptEslint from '@typescript-eslint/eslint-plugin'
import _import from 'eslint-plugin-import'
import vue from 'eslint-plugin-vue'
import { fixupPluginRules } from '@eslint/compat'
import globals from 'globals'
import path, { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
      'dist',
      'src-bex/www',
      'src-capacitor',
      'src-cordova',
      'src-ssr',
      'src-extension',
      '.quasar',
      'node_modules',
      '**/babel.config.js',
      'quasar.conf.js',
      'eslint.config.mjs',
      '.postcssrc.js',
      'typings',
    ],
}, ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:vue/vue3-recommended',
), {
    plugins: {
        '@typescript-eslint': typescriptEslint,
        import: fixupPluginRules(_import),
        vue,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.mocha,
            ga: true,
            cordova: true,
            __statics: true,
            process: true,
            Capacitor: true,
            chrome: true,
        },

        ecmaVersion: 2018,
        sourceType: 'module',

        parserOptions: {
            extraFileExtensions: ['.vue'],
            parser: '@typescript-eslint/parser',
            project: resolve(__dirname, './tsconfig.json'),
            tsconfigRootDir: __dirname,
        },
    },

    rules: {
        'generator-star-spacing': 'off',
        'arrow-parens': 'off',
        'one-var': 'off',
        'import/first': 'off',
        'import/named': 'error',
        'import/namespace': 'error',
        'import/default': 'error',
        'import/export': 'error',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-extraneous-dependencies': 'off',
        'prefer-promise-reject-errors': 'off',
        'space-before-function-paren': 'off',

        quotes: ['warn', 'single', {
            avoidEscape: true,
        }],

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-debugger': 'off',
        'no-void': 'off',
        'import/no-webpack-loader-syntax': 'off',

        '@typescript-eslint/no-unused-vars': ['warn', {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
        }],
    },
}];
