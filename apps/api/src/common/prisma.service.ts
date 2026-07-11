import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@aureus/database';

/**
 * Single PrismaClient for the process. Services are responsible for scoping
 * every query with `tenantId` from TenantContext; Postgres RLS policies
 * (added in migration SQL) provide defense-in-depth, and integration tests
 * assert cross-tenant denial per table.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
