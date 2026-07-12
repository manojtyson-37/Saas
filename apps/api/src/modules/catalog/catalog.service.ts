import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  AttachModifierGroupDto,
  CatalogListQueryDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateModifierDto,
  CreateModifierGroupDto,
  CreatePriceListDto,
  CreateVariantDto,
  SetPriceListItemsDto,
  UpdateCategoryDto,
  UpdateMenuItemDto,
  UpdateModifierDto,
  UpdateModifierGroupDto,
  UpdatePriceListDto,
  UpdateVariantDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── categories ─────────────────────────────────────────────────────────────

  listCategories() {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.category.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.category.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Category code "${dto.code}" already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, tenantId, deletedAt: null },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const category = await this.prisma.category.create({
      data: { tenantId, ...dto, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log({
      action: 'catalog.category:manage',
      entityType: 'category',
      entityId: category.id,
      after: { name: category.name, code: category.code },
    });
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const tenantId = TenantContext.requireTenantId();
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.audit.log({
      action: 'catalog.category:manage',
      entityType: 'category',
      entityId: id,
      before: { name: category.name, isActive: category.isActive },
      after: { name: updated.name, isActive: updated.isActive },
    });
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { items: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.items > 0) {
      throw new ConflictException('Category has items — reassign or delete items first');
    }
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'catalog.category:manage',
      entityType: 'category',
      entityId: id,
      before: { name: category.name },
    });
  }

  // ── menu items ─────────────────────────────────────────────────────────────

  async listItems(query: CatalogListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const items = await this.prisma.menuItem.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { code: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { isActive: true }, orderBy: { isDefault: 'desc' } },
        modifierGroups: {
          include: { group: { include: { modifiers: { where: { isActive: true } } } } },
        },
      },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      data: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  async getItem(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        variants: { orderBy: { isDefault: 'desc' } },
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: { group: { include: { modifiers: { where: { isActive: true } } } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async createItem(dto: CreateMenuItemDto) {
    const tenantId = TenantContext.requireTenantId();
    if (!dto.variants || dto.variants.length === 0) {
      throw new BadRequestException('At least one variant is required');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, tenantId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.prisma.menuItem.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Item code "${dto.code}" already exists`);

    const { variants, ...itemData } = dto;
    const item = await this.prisma.menuItem.create({
      data: {
        tenantId,
        ...itemData,
        sortOrder: itemData.sortOrder ?? 0,
        variants: {
          create: variants.map((v, i) => ({
            tenantId,
            name: v.name,
            sku: v.sku,
            basePrice: v.basePrice,
            isDefault: v.isDefault ?? i === 0,
          })),
        },
      },
      include: { variants: true },
    });

    await this.audit.log({
      action: 'catalog.item:create',
      entityType: 'menu_item',
      entityId: item.id,
      after: { name: item.name, code: item.code },
    });
    return item;
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Menu item not found');

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId, deletedAt: null },
      });
      if (!cat) throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { variants: true },
    });
    await this.audit.log({
      action: 'catalog.item:update',
      entityType: 'menu_item',
      entityId: id,
      before: { name: item.name, isAvailable: item.isAvailable },
      after: { name: updated.name, isAvailable: updated.isAvailable },
    });
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    await this.audit.log({
      action: 'catalog.item:delete',
      entityType: 'menu_item',
      entityId: id,
      before: { name: item.name },
    });
  }

  // ── variants ───────────────────────────────────────────────────────────────

  async addVariant(itemId: string, dto: CreateVariantDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItemVariant.create({
      data: { tenantId, menuItemId: itemId, ...dto },
    });
  }

  async updateVariant(itemId: string, variantId: string, dto: UpdateVariantDto) {
    const tenantId = TenantContext.requireTenantId();
    const variant = await this.prisma.menuItemVariant.findFirst({
      where: { id: variantId, menuItemId: itemId, tenantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.menuItemVariant.update({ where: { id: variantId }, data: dto });
  }

  async deleteVariant(itemId: string, variantId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
      include: { _count: { select: { variants: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item._count.variants <= 1) {
      throw new ConflictException('Cannot delete the only variant — add another variant first');
    }
    await this.prisma.menuItemVariant.delete({ where: { id: variantId } });
  }

  // ── modifier groups ────────────────────────────────────────────────────────

  listModifierGroups() {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.modifierGroup.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: { modifiers: { where: { isActive: true } } },
    });
  }

  async createModifierGroup(dto: CreateModifierGroupDto) {
    const tenantId = TenantContext.requireTenantId();
    const { modifiers, ...groupData } = dto;
    const group = await this.prisma.modifierGroup.create({
      data: {
        tenantId,
        ...groupData,
        minSelect: groupData.minSelect ?? 0,
        maxSelect: groupData.maxSelect ?? 1,
        modifiers: modifiers?.length
          ? {
              create: modifiers.map((m) => ({
                tenantId,
                name: m.name,
                price: m.price ?? 0,
                inventoryItemId: m.inventoryItemId,
                consumptionQty: m.consumptionQty,
              })),
            }
          : undefined,
      },
      include: { modifiers: true },
    });
    await this.audit.log({
      action: 'catalog.item:create',
      entityType: 'modifier_group',
      entityId: group.id,
      after: { name: group.name },
    });
    return group;
  }

  async updateModifierGroup(id: string, dto: UpdateModifierGroupDto) {
    const tenantId = TenantContext.requireTenantId();
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifierGroup.update({ where: { id }, data: dto });
  }

  async deleteModifierGroup(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { items: true } } },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    if (group._count.items > 0) {
      throw new ConflictException('Modifier group is attached to items — detach first');
    }
    await this.prisma.modifierGroup.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async addModifier(groupId: string, dto: CreateModifierDto) {
    const tenantId = TenantContext.requireTenantId();
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id: groupId, tenantId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifier.create({
      data: { tenantId, modifierGroupId: groupId, ...dto, price: dto.price ?? 0 },
    });
  }

  async updateModifier(groupId: string, modifierId: string, dto: UpdateModifierDto) {
    const tenantId = TenantContext.requireTenantId();
    const modifier = await this.prisma.modifier.findFirst({
      where: { id: modifierId, modifierGroupId: groupId, tenantId },
    });
    if (!modifier) throw new NotFoundException('Modifier not found');
    return this.prisma.modifier.update({ where: { id: modifierId }, data: dto });
  }

  async deleteModifier(groupId: string, modifierId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const modifier = await this.prisma.modifier.findFirst({
      where: { id: modifierId, modifierGroupId: groupId, tenantId },
    });
    if (!modifier) throw new NotFoundException('Modifier not found');
    await this.prisma.modifier.delete({ where: { id: modifierId } });
  }

  async attachModifierGroup(itemId: string, dto: AttachModifierGroupDto) {
    const tenantId = TenantContext.requireTenantId();
    const [item, group] = await Promise.all([
      this.prisma.menuItem.findFirst({ where: { id: itemId, tenantId, deletedAt: null } }),
      this.prisma.modifierGroup.findFirst({ where: { id: dto.modifierGroupId, tenantId, deletedAt: null } }),
    ]);
    if (!item) throw new NotFoundException('Menu item not found');
    if (!group) throw new NotFoundException('Modifier group not found');

    const existing = await this.prisma.menuItemModifierGroup.findFirst({
      where: { menuItemId: itemId, modifierGroupId: dto.modifierGroupId },
    });
    if (existing) throw new ConflictException('Modifier group already attached to this item');

    return this.prisma.menuItemModifierGroup.create({
      data: {
        tenantId,
        menuItemId: itemId,
        modifierGroupId: dto.modifierGroupId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async detachModifierGroup(itemId: string, groupId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const link = await this.prisma.menuItemModifierGroup.findFirst({
      where: { menuItemId: itemId, modifierGroupId: groupId, tenantId },
    });
    if (!link) throw new NotFoundException('Modifier group is not attached to this item');
    await this.prisma.menuItemModifierGroup.delete({ where: { id: link.id } });
  }

  // ── price lists ────────────────────────────────────────────────────────────

  listPriceLists() {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.priceList.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  }

  async getPriceList(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const pl = await this.prisma.priceList.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: true },
    });
    if (!pl) throw new NotFoundException('Price list not found');
    return pl;
  }

  async createPriceList(dto: CreatePriceListDto) {
    const tenantId = TenantContext.requireTenantId();
    const pl = await this.prisma.priceList.create({
      data: {
        tenantId,
        ...dto,
        channel: dto.channel as never,
        priority: dto.priority ?? 0,
        daysOfWeek: dto.daysOfWeek ?? [],
      },
    });
    await this.audit.log({
      action: 'catalog.price-list:manage',
      entityType: 'price_list',
      entityId: pl.id,
      after: { name: pl.name, kind: pl.kind },
    });
    return pl;
  }

  async updatePriceList(id: string, dto: UpdatePriceListDto) {
    const tenantId = TenantContext.requireTenantId();
    const pl = await this.prisma.priceList.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!pl) throw new NotFoundException('Price list not found');
    return this.prisma.priceList.update({ where: { id }, data: dto });
  }

  async deletePriceList(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const pl = await this.prisma.priceList.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!pl) throw new NotFoundException('Price list not found');
    await this.prisma.priceList.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async setPriceListItems(id: string, dto: SetPriceListItemsDto) {
    const tenantId = TenantContext.requireTenantId();
    const pl = await this.prisma.priceList.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!pl) throw new NotFoundException('Price list not found');

    // Upsert each item — delete removed ones
    const incomingVariantIds = dto.items.map((i) => i.menuItemVariantId);

    await this.prisma.$transaction([
      // delete items not in the new set
      this.prisma.priceListItem.deleteMany({
        where: { priceListId: id, menuItemVariantId: { notIn: incomingVariantIds } },
      }),
      // upsert each incoming item
      ...dto.items.map((item) =>
        this.prisma.priceListItem.upsert({
          where: { priceListId_menuItemVariantId: { priceListId: id, menuItemVariantId: item.menuItemVariantId } },
          create: { tenantId, priceListId: id, menuItemVariantId: item.menuItemVariantId, price: item.price },
          update: { price: item.price },
        }),
      ),
    ]);

    return this.getPriceList(id);
  }

  // ── menu publish ───────────────────────────────────────────────────────────

  /** Build and return a full outlet menu snapshot (POS/QR-ready JSON). */
  async publishMenu(outletId: string) {
    const tenantId = TenantContext.requireTenantId();
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: outletId, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');

    const [categories, items, priceLists] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId, deletedAt: null, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { tenantId, deletedAt: null, isSellable: true, isAvailable: true },
        include: {
          variants: { where: { isActive: true }, orderBy: { isDefault: 'desc' } },
          modifierGroups: {
            orderBy: { sortOrder: 'asc' },
            include: {
              group: {
                include: { modifiers: { where: { isActive: true }, orderBy: { name: 'asc' } } },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.priceList.findMany({
        where: {
          tenantId,
          deletedAt: null,
          isActive: true,
          OR: [{ outletId }, { outletId: null }],
        },
        include: { items: true },
        orderBy: { priority: 'desc' },
      }),
    ]);

    const snapshot = {
      outletId,
      publishedAt: new Date().toISOString(),
      categories,
      items,
      priceLists,
    };

    await this.audit.log({
      action: 'catalog.menu:publish',
      entityType: 'outlet',
      entityId: outletId,
      after: { itemCount: items.length },
    });

    return snapshot;
  }
}
