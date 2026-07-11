/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@aureus/shared$': '<rootDir>/../../packages/shared/src',
    '^@aureus/database$': '<rootDir>/../../packages/database/src',
  },
};
