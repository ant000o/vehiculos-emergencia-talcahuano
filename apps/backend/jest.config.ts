import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: false, tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: ['.*node_modules/(?!.*(@nestjs|uuid))'],
  testEnvironment: 'node',
};

export default config;
