import js from '@eslint/js';
import {defineConfig} from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        plugins: {js},
        extends: ['js/recommended'],
        languageOptions: {globals: globals.browser},
    },
]);
