import type { JestConfigWithTsJest } from 'ts-jest';

// ********************************************************************************
const jestConfig: JestConfigWithTsJest = {
  // the following options ensure packages that use ESM
  // work correctly in tests
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.tsx?$': [ 'ts-jest', { useESM: true } ], },
  moduleDirectories: ['node_modules', 'src'],
}

export default jestConfig;
