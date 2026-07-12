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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ProductionService } from './production.service';
import {
  CompleteProductionOrderDto,
  CreateProductionOrderDto,
  CreateRecipeDto,
  ProductionOrderQueryDto,
  RecipeListQueryDto,
  SetRecipeIngredientsDto,
  UpdateRecipeDto,
} from './dto/production.dto';

@ApiTags('production')
@ApiBearerAuth()
@Controller('production')
export class ProductionController {
  constructor(private readonly svc: ProductionService) {}

  // ── Recipes ────────────────────────────────────────────────────────────────

  @Get('recipes')
  @RequirePermission('production.recipe:read')
  @ApiOperation({ summary: 'List recipes' })
  listRecipes(@Query() q: RecipeListQueryDto) {
    return this.svc.listRecipes(q);
  }

  @Post('recipes')
  @RequirePermission('production.recipe:create')
  @ApiOperation({ summary: 'Create a recipe' })
  createRecipe(@Body() dto: CreateRecipeDto) {
    return this.svc.createRecipe(dto);
  }

  @Get('recipes/:id')
  @RequirePermission('production.recipe:read')
  @ApiOperation({ summary: 'Get a recipe with ingredients and versions' })
  getRecipe(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getRecipe(id);
  }

  @Patch('recipes/:id')
  @RequirePermission('production.recipe:update')
  @ApiOperation({ summary: 'Update recipe header fields' })
  updateRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.svc.updateRecipe(id, dto);
  }

  @Delete('recipes/:id')
  @RequirePermission('production.recipe:delete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft-delete a recipe' })
  deleteRecipe(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deleteRecipe(id);
  }

  @Put('recipes/:id/ingredients')
  @RequirePermission('production.recipe:update')
  @ApiOperation({ summary: 'Replace all recipe ingredients (BOM)' })
  setIngredients(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRecipeIngredientsDto,
  ) {
    return this.svc.setIngredients(id, dto);
  }

  @Post('recipes/:id/publish')
  @RequirePermission('production.recipe:update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Publish a recipe version (snapshots current BOM + cost)' })
  publishRecipe(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user?: { sub?: string } }) {
    return this.svc.publishRecipe(id, req.user?.sub);
  }

  // ── Production Orders ──────────────────────────────────────────────────────

  @Get('orders')
  @RequirePermission('production.order:read')
  @ApiOperation({ summary: 'List production orders' })
  listOrders(@Query() q: ProductionOrderQueryDto) {
    return this.svc.listProductionOrders(q);
  }

  @Post('orders')
  @RequirePermission('production.order:create')
  @ApiOperation({ summary: 'Create a production order (PLANNED)' })
  createOrder(@Body() dto: CreateProductionOrderDto) {
    return this.svc.createProductionOrder(dto);
  }

  @Get('orders/:id')
  @RequirePermission('production.order:read')
  @ApiOperation({ summary: 'Get a production order' })
  getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getProductionOrder(id);
  }

  @Post('orders/:id/start')
  @RequirePermission('production.order:create')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a production order (PLANNED → IN_PROGRESS)' })
  startOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.startProductionOrder(id);
  }

  @Post('orders/:id/complete')
  @RequirePermission('production.order:complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete a production order — posts stock movements' })
  completeOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteProductionOrderDto,
  ) {
    return this.svc.completeProductionOrder(id, dto);
  }

  @Delete('orders/:id')
  @RequirePermission('production.order:create')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a production order' })
  cancelOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.cancelProductionOrder(id);
  }
}
