// Vercel serverless entry. Requires the tsc-compiled output so NestJS
// decorator metadata (emitDecoratorMetadata) survives — bundler-based TS
// transforms would strip it and break dependency injection at runtime.
module.exports = require('../dist/serverless').default;
