module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'plugin:@typescript-eslint/recommended',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  rules: {
    quotes: [2, 'single'],
    semi: [2, 'always']
  }
};
