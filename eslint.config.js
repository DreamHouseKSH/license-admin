import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier'; // Prettier 충돌 방지

export default [
  { ignores: ['dist', 'node_modules'] }, // node_modules도 제외
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest', // 최신 ECMAScript 버전 사용
      sourceType: 'module',
      globals: {
        ...globals.browser, // 브라우저 전역 변수
        ...globals.node, // Node.js 전역 변수 (필요시)
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }, // JSX 파싱 활성화
      },
    },
    plugins: {
      react: pluginReact, // React 플러그인 추가
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules, // ESLint 권장 규칙
      ...pluginReact.configs.recommended.rules, // React 권장 규칙
      ...reactHooks.configs.recommended.rules, // React Hooks 권장 규칙
      ...prettierConfig.rules, // Prettier 충돌 규칙 비활성화
      'react/react-in-jsx-scope': 'off', // React 17+ 에서는 필요 없음
      'react/prop-types': 'off', // PropTypes 사용 안 함 (TypeScript 등으로 대체 가능)
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ], // 사용하지 않는 변수 경고 (밑줄 시작 변수/인자 제외)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: {
        version: 'detect', // 설치된 React 버전 자동 감지
      },
    },
  },
];
