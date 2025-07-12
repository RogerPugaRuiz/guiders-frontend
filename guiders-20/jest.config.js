const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/test.ts',
    '!src/environments/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary', 'lcov'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@libs/(.*)$': '<rootDir>/../libs/$1',
    '^src/environments/environment$': '<rootDir>/src/environments/environment.ts',
    '^src/environments/environment.prod$': '<rootDir>/src/environments/environment.prod.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@angular|@ngrx|@multiavatar|uuid|socket.io-client))',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/cypress/',
  ],
};
