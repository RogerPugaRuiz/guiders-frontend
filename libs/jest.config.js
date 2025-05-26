module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/../guiders/tsconfig.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        isolatedModules: true
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)']
};
