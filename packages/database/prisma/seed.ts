/**
 * Development seed: creates a demo tenant with the system role catalog,
 * an owner login, an org hierarchy (company → brand → location → outlet →
 * floor/tables/terminal/stores), tax groups and UoMs — enough to sign in
 * and exercise every P0 flow.
 *
 * Requires `@aureus/shared` to be built (`pnpm --filter @aureus/shared build`).
 */
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';
import { SYSTEM_ROLES } from '@aureus/shared';

const prisma = new PrismaClient();

// Mirrors apps/api hashing (see apps/api/src/modules/identity/auth/password.service.ts)
// so seeded credentials work.
function hashSecret(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Hospitality Group',
      slug: 'demo',
      status: 'ACTIVE',
      plan: 'enterprise',
    },
  });

  // Activate every module for the demo tenant.
  const modules = [
    'core', 'pos', 'hotel', 'inventory', 'procurement', 'production', 'bar',
    'crm', 'accounting', 'hr', 'assets', 'reporting', 'ai', 'integrations',
  ];
  for (const moduleCode of modules) {
    await prisma.moduleSubscription.upsert({
      where: { tenantId_moduleCode: { tenantId: tenant.id, moduleCode } },
      update: { active: true },
      create: { tenantId: tenant.id, moduleCode, active: true },
    });
  }

  // System roles from the shared catalog.
  const roleIds = new Map<string, string>();
  for (const def of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: def.code } },
      update: { name: def.name, description: def.description },
      create: {
        tenantId: tenant.id,
        code: def.code,
        name: def.name,
        description: def.description,
        isSystem: true,
      },
    });
    roleIds.set(def.code, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: def.grants.map((permission) => ({
        tenantId: tenant.id,
        roleId: role.id,
        permission,
      })),
    });
  }

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.aureus.app' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demo.aureus.app',
      firstName: 'Demo',
      lastName: 'Owner',
      passwordHash: hashSecret('Demo@12345'),
      posPinHash: hashSecret('1234'),
      status: 'ACTIVE',
      isTenantOwner: true,
    },
  });

  const ownerRoleId = roleIds.get('owner');
  if (ownerRoleId) {
    const existing = await prisma.userRoleAssignment.findFirst({
      where: { userId: owner.id, roleId: ownerRoleId, scopeType: 'TENANT' },
    });
    if (!existing) {
      await prisma.userRoleAssignment.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          roleId: ownerRoleId,
          scopeType: 'TENANT',
        },
      });
    }
  }

  // Org hierarchy.
  const company = await prisma.company.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'DEMO-CO' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Demo Hospitality Pvt Ltd',
      legalName: 'Demo Hospitality Private Limited',
      code: 'DEMO-CO',
      taxRegistrationNumber: '29ABCDE1234F1Z5',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  });

  const brand = await prisma.brand.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'SPICE' } },
    update: {},
    create: {
      tenantId: tenant.id,
      companyId: company.id,
      name: 'Spice Route',
      code: 'SPICE',
      cuisineType: 'Indian',
    },
  });

  const location = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BLR-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      companyId: company.id,
      brandId: brand.id,
      name: 'Spice Route — Indiranagar',
      code: 'BLR-01',
      type: 'RESTAURANT',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  });

  const outlet = await prisma.outlet.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BLR-01-MAIN' } },
    update: {},
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      name: 'Main Dining',
      code: 'BLR-01-MAIN',
      type: 'DINE_IN',
    },
  });

  const existingFloor = await prisma.floor.findFirst({
    where: { tenantId: tenant.id, outletId: outlet.id, name: 'Ground Floor' },
  });
  const floor = existingFloor ?? await prisma.floor.create({
    data: { tenantId: tenant.id, outletId: outlet.id, name: 'Ground Floor' },
  });

  const tableCount = await prisma.diningTable.count({
    where: { tenantId: tenant.id, floorId: floor.id },
  });
  if (tableCount === 0) {
    await prisma.diningTable.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        tenantId: tenant.id,
        floorId: floor.id,
        name: `T${i + 1}`,
        capacity: i < 8 ? 4 : 6,
        posX: (i % 4) * 120,
        posY: Math.floor(i / 4) * 120,
      })),
    });
  }

  await prisma.posTerminal.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BLR-01-T1' } },
    update: {},
    create: {
      tenantId: tenant.id,
      outletId: outlet.id,
      name: 'Counter 1',
      code: 'BLR-01-T1',
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
  });

  for (const [code, name, type] of [
    ['BLR-01-MS', 'Main Store', 'MAIN'],
    ['BLR-01-KS', 'Kitchen Store', 'KITCHEN'],
    ['BLR-01-BS', 'Bar Store', 'BAR'],
  ] as const) {
    await prisma.store.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code } },
      update: {},
      create: { tenantId: tenant.id, locationId: location.id, name, code, type },
    });
  }

  await prisma.kitchenStation.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BLR-01-HOT' } },
    update: {},
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      name: 'Hot Kitchen',
      code: 'BLR-01-HOT',
    },
  });

  // Tax groups (India GST).
  for (const [code, name, rate] of [
    ['GST-0', 'GST 0%', 0],
    ['GST-5', 'GST 5%', 5],
    ['GST-12', 'GST 12%', 12],
    ['GST-18', 'GST 18%', 18],
  ] as const) {
    const group = await prisma.taxGroup.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code } },
      update: {},
      create: { tenantId: tenant.id, code, name, totalRate: rate },
    });
    const componentCount = await prisma.taxComponent.count({
      where: { taxGroupId: group.id },
    });
    if (componentCount === 0 && rate > 0) {
      await prisma.taxComponent.createMany({
        data: [
          { tenantId: tenant.id, taxGroupId: group.id, name: 'CGST', rate: rate / 2 },
          { tenantId: tenant.id, taxGroupId: group.id, name: 'SGST', rate: rate / 2 },
        ],
      });
    }
  }

  // Units of measure.
  for (const [code, name, precision] of [
    ['KG', 'Kilogram', 3],
    ['GM', 'Gram', 1],
    ['LT', 'Litre', 3],
    ['ML', 'Millilitre', 1],
    ['PC', 'Piece', 0],
    ['PKT', 'Packet', 0],
    ['BTL', 'Bottle', 0],
  ] as const) {
    await prisma.uom.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code } },
      update: {},
      create: { tenantId: tenant.id, code, name, precision },
    });
  }

  console.log('Seed complete.');
  console.log('  Tenant:  demo');
  console.log('  Login:   owner@demo.aureus.app / Demo@12345 (POS PIN 1234)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
