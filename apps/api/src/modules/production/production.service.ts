import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { SequenceService, TENANT_SCOPE } from '../../common/sequence.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  CompleteProductionOrderDto,
  CreateProductionOrderDto,
  CreateRecipeDto,
  ProductionOrderQueryDto,
  RecipeListQueryDto,
  SetRecipeIngredientsDto,
  UpdateRecipeDto,
} from './dto/production.dto';

async function upsertStockSummary(
  tx: PrismaService,
  tenantId: string,
  storeId: string,
  itemId: string,
  qtyDelta: Decimal,
  unitCost: Decimal,
): Promise<void> {
  const existing = await tx.stockSummary.findUnique({
    where: { storeId_itemId: { storeId, itemId } },
  });

  let newAvgCost: Decimal;
  let newOnHand: Decimal;

  if (!existing) {
    newOnHand = qtyDelta;
    newAvgCost = qtyDelta.greaterThan(0) ? unitCost : new Decimal(0);
  } else {
    newOnHand = new Decimal(existing.onHand).plus(qtyDelta);
    if (qtyDelta.greaterThan(0)) {
      const numerator = new Decimal(existing.onHand)
        .times(existing.avgCost)
        .plus(qtyDelta.times(unitCost));
      newAvgCost = newOnHand.isZero() ? unitCost : numerator.dividedBy(newOnHand);
    } else {
      newAvgCost = new Decimal(existing.avgCost);
    }
  }

  await tx.stockSummary.upsert({
    where: { storeId_itemId: { storeId, itemId } },
    create: { tenantId, storeId, itemId, onHand: newOnHand, avgCost: newAvgCost },
    update: { onHand: newOnHand, avgCost: newAvgCost },
  });
}

async function computeCost(
  prisma: PrismaService,
  tenantId: string,
  recipeId: string,
): Promise<Decimal> {
  const ingredients = await prisma.recipeIngredient.findMany({
    where: { tenantId, recipeId },
  });
  let total = new Decimal(0);
  for (const ing of ingredients) {
    const effectiveQty = new Decimal(ing.qty).times(
      new Decimal(1).plus(new Decimal(ing.wastagePct).dividedBy(100)),
    );
    if (ing.itemId) {
      const item = await prisma.inventoryItem.findUnique({ where: { id: ing.itemId } });
      if (item) total = total.plus(effectiveQty.times(item.standardCost));
    } else if (ing.subRecipeId) {
      const sub = await prisma.recipe.findUnique({ where: { id: ing.subRecipeId } });
      if (sub) total = total.plus(effectiveQty.times(sub.theoreticalCost));
    }
  }
  return total;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly audit: AuditService,
  ) {}

  // ── Recipes ────────────────────────────────────────────────────────────────

  async listRecipes(q: RecipeListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = Math.min(q.limit ?? 50, 200);
    const rows = await this.prisma.recipe.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(q.q
          ? {
              OR: [
                { name: { contains: q.q, mode: 'insensitive' } },
                { code: { contains: q.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.cursor ? { id: { gt: q.cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
      include: { ingredients: true },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? (rows[rows.length - 1]?.id ?? null) : null };
  }

  async createRecipe(dto: CreateRecipeDto) {
    const tenantId = TenantContext.requireTenantId();

    const recipe = await this.prisma.recipe.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        outputItemId: dto.outputItemId,
        yieldQty: dto.yieldQty ?? 1,
        yieldUomId: dto.yieldUomId,
        portionSize: dto.portionSize,
        instructions: dto.instructions,
        ...(dto.ingredients?.length
          ? {
              ingredients: {
                create: dto.ingredients.map((ing) => ({
                  tenantId,
                  itemId: ing.itemId,
                  subRecipeId: ing.subRecipeId,
                  qty: ing.qty,
                  uomId: ing.uomId,
                  wastagePct: ing.wastagePct ?? 0,
                })),
              },
            }
          : {}),
      },
      include: { ingredients: true },
    });

    const cost = await computeCost(this.prisma, tenantId, recipe.id);
    await this.prisma.recipe.update({ where: { id: recipe.id }, data: { theoreticalCost: cost } });

    await this.audit.log({
      action: 'production.recipe:create',
      entityType: 'recipe',
      entityId: recipe.id,
      after: { name: recipe.name, code: recipe.code },
    });
    return { ...recipe, theoreticalCost: cost };
  }

  async getRecipe(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { ingredients: true, versions: { orderBy: { version: 'desc' } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async updateRecipe(id: string, dto: UpdateRecipeDto) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.recipe.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Recipe not found');

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        outputItemId: dto.outputItemId !== undefined ? dto.outputItemId : existing.outputItemId,
        yieldQty: dto.yieldQty ?? existing.yieldQty,
        yieldUomId: dto.yieldUomId !== undefined ? dto.yieldUomId : existing.yieldUomId,
        portionSize: dto.portionSize !== undefined ? dto.portionSize : existing.portionSize,
        instructions: dto.instructions !== undefined ? dto.instructions : existing.instructions,
      },
    });
    await this.audit.log({
      action: 'production.recipe:update',
      entityType: 'recipe',
      entityId: id,
      after: dto,
    });
    return updated;
  }

  async deleteRecipe(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.recipe.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Recipe not found');
    await this.prisma.recipe.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.audit.log({ action: 'production.recipe:delete', entityType: 'recipe', entityId: id });
    return { success: true };
  }

  async setIngredients(recipeId: string, dto: SetRecipeIngredientsDto) {
    const tenantId = TenantContext.requireTenantId();
    const recipe = await this.prisma.recipe.findFirst({ where: { id: recipeId, tenantId, deletedAt: null } });
    if (!recipe) throw new NotFoundException('Recipe not found');

    for (const ing of dto.ingredients) {
      if (!ing.itemId && !ing.subRecipeId)
        throw new BadRequestException('Each ingredient must have itemId or subRecipeId');
      if (ing.itemId && ing.subRecipeId)
        throw new BadRequestException('Ingredient must have either itemId or subRecipeId, not both');
      if (ing.subRecipeId === recipeId)
        throw new BadRequestException('Recipe cannot reference itself as sub-recipe');
    }

    await this.prisma.$transaction([
      this.prisma.recipeIngredient.deleteMany({ where: { tenantId, recipeId } }),
      this.prisma.recipeIngredient.createMany({
        data: dto.ingredients.map((ing) => ({
          tenantId,
          recipeId,
          itemId: ing.itemId,
          subRecipeId: ing.subRecipeId,
          qty: ing.qty,
          uomId: ing.uomId,
          wastagePct: ing.wastagePct ?? 0,
        })),
      }),
    ]);

    const cost = await computeCost(this.prisma, tenantId, recipeId);
    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { theoreticalCost: cost },
      include: { ingredients: true },
    });

    await this.audit.log({
      action: 'production.recipe:update',
      entityType: 'recipe',
      entityId: recipeId,
      after: { ingredientCount: dto.ingredients.length },
    });
    return updated;
  }

  async publishRecipe(recipeId: string, userId?: string) {
    const tenantId = TenantContext.requireTenantId();
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, tenantId, deletedAt: null },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const cost = await computeCost(this.prisma, tenantId, recipeId);
    const nextVersion = recipe.currentVersion + 1;

    const ingredientSnapshots: Record<string, unknown>[] = [];
    for (const ing of recipe.ingredients) {
      let name = 'Unknown';
      let unitCost = new Decimal(0);
      if (ing.itemId) {
        const item = await this.prisma.inventoryItem.findUnique({ where: { id: ing.itemId } });
        if (item) { name = item.name; unitCost = new Decimal(item.standardCost); }
      } else if (ing.subRecipeId) {
        const sub = await this.prisma.recipe.findUnique({ where: { id: ing.subRecipeId } });
        if (sub) { name = sub.name; unitCost = new Decimal(sub.theoreticalCost); }
      }
      ingredientSnapshots.push({
        id: ing.id,
        itemId: ing.itemId,
        subRecipeId: ing.subRecipeId,
        name,
        qty: ing.qty.toString(),
        uomId: ing.uomId,
        wastagePct: ing.wastagePct.toString(),
        unitCost: unitCost.toString(),
        effectiveQty: new Decimal(ing.qty)
          .times(new Decimal(1).plus(new Decimal(ing.wastagePct).dividedBy(100)))
          .toString(),
      });
    }

    const snapshot: Prisma.InputJsonValue = {
      ingredients: ingredientSnapshots as unknown as Prisma.InputJsonValue,
      yieldQty: recipe.yieldQty.toString(),
    };

    await this.prisma.$transaction([
      this.prisma.recipeVersion.create({
        data: {
          tenantId,
          recipeId,
          version: nextVersion,
          snapshot,
          cost,
          publishedBy: userId,
        },
      }),
      this.prisma.recipe.update({
        where: { id: recipeId },
        data: { currentVersion: nextVersion, theoreticalCost: cost },
      }),
    ]);

    await this.audit.log({
      action: 'production.recipe:update',
      entityType: 'recipe',
      entityId: recipeId,
      after: { publishedVersion: nextVersion, cost: cost.toString() },
    });
    return { recipeId, version: nextVersion, cost: cost.toString() };
  }

  // ── Production Orders ──────────────────────────────────────────────────────

  async listProductionOrders(q: ProductionOrderQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = Math.min(q.limit ?? 50, 200);
    const rows = await this.prisma.productionOrder.findMany({
      where: {
        tenantId,
        ...(q.status ? { status: q.status } : {}),
        ...(q.storeId ? { storeId: q.storeId } : {}),
        ...(q.recipeId ? { recipeId: q.recipeId } : {}),
        ...(q.cursor ? { id: { lt: q.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? (rows[rows.length - 1]?.id ?? null) : null };
  }

  async createProductionOrder(dto: CreateProductionOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: dto.recipeId, tenantId, deletedAt: null, isActive: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found or inactive');

    const number = await this.seq.next(tenantId, TENANT_SCOPE, 'PRODUCTION_ORDER', 'PRO', 6);

    const order = await this.prisma.productionOrder.create({
      data: {
        tenantId,
        number,
        recipeId: dto.recipeId,
        storeId: dto.storeId,
        plannedQty: dto.plannedQty,
        status: 'PLANNED',
        businessDate: new Date(dto.businessDate),
        createdBy: TenantContext.get()?.userId,
      },
    });
    await this.audit.log({
      action: 'production.order:create',
      entityType: 'production_order',
      entityId: order.id,
      after: { number, recipeId: dto.recipeId, plannedQty: dto.plannedQty },
    });
    return order;
  }

  async getProductionOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.productionOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Production order not found');
    return order;
  }

  async startProductionOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.productionOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Production order not found');
    if (order.status !== 'PLANNED')
      throw new UnprocessableEntityException(`Cannot start a ${order.status} production order`);

    const updated = await this.prisma.productionOrder.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
    await this.audit.log({
      action: 'production.order:create',
      entityType: 'production_order',
      entityId: id,
      after: { status: 'IN_PROGRESS' },
    });
    return updated;
  }

  async completeProductionOrder(id: string, dto: CompleteProductionOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.productionOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Production order not found');
    if (order.status !== 'IN_PROGRESS')
      throw new UnprocessableEntityException(`Cannot complete a ${order.status} production order`);

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: order.recipeId, tenantId },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const scale = new Decimal(dto.producedQty).dividedBy(recipe.yieldQty);
    const businessDate = today();

    await this.prisma.$transaction(async (tx) => {
      const txp = tx as PrismaService;
      let totalMaterialCost = new Decimal(0);

      for (const ing of recipe.ingredients) {
        if (!ing.itemId) continue;
        const effectiveQty = new Decimal(ing.qty)
          .times(new Decimal(1).plus(new Decimal(ing.wastagePct).dividedBy(100)))
          .times(scale);
        const consumeQty = effectiveQty.negated();

        const summary = await txp.stockSummary.findUnique({
          where: { storeId_itemId: { storeId: order.storeId, itemId: ing.itemId } },
        });
        const unitCost = new Decimal(summary?.avgCost ?? 0);
        totalMaterialCost = totalMaterialCost.plus(effectiveQty.times(unitCost));

        await txp.stockLedger.create({
          data: {
            tenantId,
            storeId: order.storeId,
            itemId: ing.itemId,
            movementType: 'PRODUCTION_CONSUME',
            qty: consumeQty,
            unitCost,
            sourceType: 'production_order',
            sourceId: id,
            businessDate,
          },
        });
        await upsertStockSummary(txp, tenantId, order.storeId, ing.itemId, consumeQty, unitCost);
      }

      const actualCost = dto.actualCost !== undefined ? new Decimal(dto.actualCost) : totalMaterialCost;
      const producedQty = new Decimal(dto.producedQty);
      const outputUnitCost = producedQty.isZero() ? new Decimal(0) : actualCost.dividedBy(producedQty);

      if (recipe.outputItemId) {
        await txp.stockLedger.create({
          data: {
            tenantId,
            storeId: order.storeId,
            itemId: recipe.outputItemId,
            movementType: 'PRODUCTION_OUTPUT',
            qty: producedQty,
            unitCost: outputUnitCost,
            sourceType: 'production_order',
            sourceId: id,
            businessDate,
          },
        });
        await upsertStockSummary(txp, tenantId, order.storeId, recipe.outputItemId, producedQty, outputUnitCost);
      }

      await txp.productionOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          producedQty: dto.producedQty,
          actualCost,
          completedAt: new Date(),
        },
      });
    });

    await this.audit.log({
      action: 'production.order:complete',
      entityType: 'production_order',
      entityId: id,
      after: { status: 'COMPLETED', producedQty: dto.producedQty },
    });
    return this.getProductionOrder(id);
  }

  async cancelProductionOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.productionOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Production order not found');
    if (order.status === 'COMPLETED')
      throw new UnprocessableEntityException('Cannot cancel a completed production order');

    const updated = await this.prisma.productionOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.audit.log({
      action: 'production.order:create',
      entityType: 'production_order',
      entityId: id,
      after: { status: 'CANCELLED' },
    });
    return updated;
  }
}
