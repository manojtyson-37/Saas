import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Serverless entry: the Nest application is initialised once per warm
 * instance and reused across invocations. No `listen()` — the platform
 * (e.g. Vercel) invokes the exported handler per request.
 */
let serverPromise: Promise<Express> | null = null;

async function createServer(): Promise<Express> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bufferLogs: false,
  });
  configureApp(app);
  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  serverPromise ??= createServer();
  try {
    const server = await serverPromise;
    server(req, res);
  } catch (err) {
    // Don't memoize a failed bootstrap (e.g. transient DB timeout) — let the
    // next invocation on this warm instance retry from scratch.
    serverPromise = null;
    throw err;
  }
}
