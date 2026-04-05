module.exports = {
  projects: [
    {
      displayName: 'electron',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/electron/**/__tests__/**/*.{js,ts}'],
      collectCoverageFrom: ['<rootDir>/electron/modules/**/*.js'],
    },
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/**/*.test.{ts,tsx}'],
      transform: { '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-typescript', '@babel/preset-react'] }] },
      collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}', '!<rootDir>/src/**/*.d.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    }
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
