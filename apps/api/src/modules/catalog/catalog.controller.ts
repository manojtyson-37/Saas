import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CatalogService } from './catalog.service';
import {
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

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  // ── categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  @RequirePermission('catalog.category:read')
  @ApiOperation({ summary: 'List all categories (tree-ready, sorted by sortOrder)' })
  listCategories() {
    return this.svc.listCategories();
  }

  @Post('categories')
  @RequirePermission('catalog.category:manage')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.svc.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermission('catalog.category:manage')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.svc.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  @RequirePermission('catalog.category:manage')
  @ApiOperation({ summary: 'Delete a category (must have no items)' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deleteCategory(id);
  }

  // ── menu items ─────────────────────────────────────────────────────────────

  @Get('items')
  @RequirePermission('catalog.item:read')
  @ApiOperation({ summary: 'List menu items (cursor-paginated)' })
  listItems(@Query() query: CatalogListQueryDto) {
    return this.svc.listItems(query);
  }

  @Post('items')
  @RequirePermission('catalog.item:create')
  @ApiOperation({ summary: 'Create a menu item with variants' })
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.svc.createItem(dto);
  }

  @Get('items/:id')
  @RequirePermission('catalog.item:read')
  @ApiOperation({ summary: 'Get a menu item with all variants and modifier groups' })
  getItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getItem(id);
  }

  @Patch('items/:id')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Update a menu item' })
  updateItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this.svc.updateItem(id, dto);
  }

  @Delete('items/:id')
  @HttpCode(204)
  @RequirePermission('catalog.item:delete')
  @ApiOperation({ summary: 'Soft-delete a menu item' })
  async deleteItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deleteItem(id);
  }

  // ── variants ───────────────────────────────────────────────────────────────

  @Post('items/:id/variants')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Add a variant to a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  addVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateVariantDto) {
    return this.svc.addVariant(id, dto);
  }

  @Patch('items/:id/variants/:variantId')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Update a variant' })
  updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.svc.updateVariant(id, variantId, dto);
  }

  @Delete('items/:id/variants/:variantId')
  @HttpCode(204)
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Delete a variant (cannot delete the only variant)' })
  async deleteVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    await this.svc.deleteVariant(id, variantId);
  }

  // ── modifier groups on items ───────────────────────────────────────────────

  @Post('items/:id/modifier-groups')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Attach a modifier group to a menu item' })
  attachModifierGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachModifierGroupDto,
  ) {
    return this.svc.attachModifierGroup(id, dto);
  }

  @Delete('items/:id/modifier-groups/:groupId')
  @HttpCode(204)
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Detach a modifier group from a menu item' })
  async detachModifierGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.svc.detachModifierGroup(id, groupId);
  }

  // ── modifier groups ────────────────────────────────────────────────────────

  @Get('modifier-groups')
  @RequirePermission('catalog.item:read')
  @ApiOperation({ summary: 'List all modifier groups with modifiers' })
  listModifierGroups() {
    return this.svc.listModifierGroups();
  }

  @Post('modifier-groups')
  @RequirePermission('catalog.item:create')
  @ApiOperation({ summary: 'Create a modifier group' })
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.svc.createModifierGroup(dto);
  }

  @Patch('modifier-groups/:id')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Update a modifier group' })
  updateModifierGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    return this.svc.updateModifierGroup(id, dto);
  }

  @Delete('modifier-groups/:id')
  @HttpCode(204)
  @RequirePermission('catalog.item:delete')
  @ApiOperation({ summary: 'Delete a modifier group (must be detached from all items)' })
  async deleteModifierGroup(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deleteModifierGroup(id);
  }

  @Post('modifier-groups/:id/modifiers')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Add a modifier to a group' })
  addModifier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateModifierDto) {
    return this.svc.addModifier(id, dto);
  }

  @Patch('modifier-groups/:id/modifiers/:modifierId')
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Update a modifier' })
  updateModifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
    @Body() dto: UpdateModifierDto,
  ) {
    return this.svc.updateModifier(id, modifierId, dto);
  }

  @Delete('modifier-groups/:id/modifiers/:modifierId')
  @HttpCode(204)
  @RequirePermission('catalog.item:update')
  @ApiOperation({ summary: 'Delete a modifier' })
  async deleteModifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
  ) {
    await this.svc.deleteModifier(id, modifierId);
  }

  // ── price lists ────────────────────────────────────────────────────────────

  @Get('price-lists')
  @RequirePermission('catalog.price-list:read')
  @ApiOperation({ summary: 'List price lists' })
  listPriceLists() {
    return this.svc.listPriceLists();
  }

  @Post('price-lists')
  @RequirePermission('catalog.price-list:manage')
  @ApiOperation({ summary: 'Create a price list' })
  createPriceList(@Body() dto: CreatePriceListDto) {
    return this.svc.createPriceList(dto);
  }

  @Get('price-lists/:id')
  @RequirePermission('catalog.price-list:read')
  @ApiOperation({ summary: 'Get price list with items' })
  getPriceList(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getPriceList(id);
  }

  @Patch('price-lists/:id')
  @RequirePermission('catalog.price-list:manage')
  @ApiOperation({ summary: 'Update a price list' })
  updatePriceList(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePriceListDto) {
    return this.svc.updatePriceList(id, dto);
  }

  @Delete('price-lists/:id')
  @HttpCode(204)
  @RequirePermission('catalog.price-list:manage')
  @ApiOperation({ summary: 'Soft-delete a price list' })
  async deletePriceList(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deletePriceList(id);
  }

  @Put('price-lists/:id/items')
  @RequirePermission('catalog.price-list:manage')
  @ApiOperation({ summary: 'Replace all price list items (full sync)' })
  setPriceListItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPriceListItemsDto,
  ) {
    return this.svc.setPriceListItems(id, dto);
  }
}

// ── outlet menu publish ────────────────────────────────────────────────────────

@ApiTags('outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletMenuController {
  constructor(private readonly svc: CatalogService) {}

  @Post(':id/menu/publish')
  @RequirePermission('catalog.menu:publish')
  @ApiOperation({ summary: 'Build and return the outlet menu snapshot (POS/QR-ready)' })
  publishMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.publishMenu(id);
  }
}
