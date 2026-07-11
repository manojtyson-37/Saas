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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { OrganizationService } from './organization.service';
import {
  CreateBrandDto,
  CreateCompanyDto,
  CreateFloorDto,
  CreateLocationDto,
  CreateOutletDto,
  CreateStoreDto,
  CreateTableDto,
  CreateTerminalDto,
  UpdateBrandDto,
  UpdateCompanyDto,
  UpdateLocationDto,
  UpdateOutletDto,
  UpdateStoreDto,
  UpdateTableDto,
  UpdateTerminalDto,
} from './dto/organization.dto';

@ApiTags('organization')
@ApiBearerAuth()
@Controller()
export class OrganizationController {
  constructor(private readonly org: OrganizationService) {}

  // ── companies ─────────────────────────────────────────────────────────────

  @Get('companies')
  @RequirePermission('organization.company:read')
  @ApiOperation({ summary: 'List companies (legal entities)' })
  listCompanies() {
    return this.org.listCompanies();
  }

  @Get('companies/:id')
  @RequirePermission('organization.company:read')
  @ApiOperation({ summary: 'Get a company with brands and locations' })
  getCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.getCompany(id);
  }

  @Post('companies')
  @RequirePermission('organization.company:create')
  @ApiOperation({ summary: 'Create a company' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.org.createCompany(dto);
  }

  @Patch('companies/:id')
  @RequirePermission('organization.company:update')
  @ApiOperation({ summary: 'Update a company' })
  updateCompany(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.org.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @HttpCode(204)
  @RequirePermission('organization.company:delete')
  @ApiOperation({ summary: 'Soft-delete an empty company' })
  deleteCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.deleteCompany(id);
  }

  // ── brands ────────────────────────────────────────────────────────────────

  @Get('brands')
  @RequirePermission('organization.brand:read')
  @ApiOperation({ summary: 'List brands' })
  listBrands(@Query('companyId') companyId?: string) {
    return this.org.listBrands(companyId);
  }

  @Post('brands')
  @RequirePermission('organization.brand:create')
  @ApiOperation({ summary: 'Create a brand' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.org.createBrand(dto);
  }

  @Patch('brands/:id')
  @RequirePermission('organization.brand:update')
  @ApiOperation({ summary: 'Update a brand' })
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.org.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @HttpCode(204)
  @RequirePermission('organization.brand:delete')
  @ApiOperation({ summary: 'Soft-delete an empty brand' })
  deleteBrand(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.deleteBrand(id);
  }

  // ── locations ─────────────────────────────────────────────────────────────

  @Get('locations')
  @RequirePermission('organization.location:read')
  @ApiOperation({ summary: "List locations visible in the caller's scope" })
  listLocations(
    @Query('companyId') companyId?: string,
    @Query('brandId') brandId?: string,
  ) {
    return this.org.listLocations({ companyId, brandId });
  }

  @Get('locations/:id')
  @RequirePermission('organization.location:read')
  @ApiOperation({ summary: 'Get a location with outlets, stores, kitchen stations' })
  getLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.getLocation(id);
  }

  @Post('locations')
  @RequirePermission('organization.location:create')
  @ApiOperation({ summary: 'Create a location (site)' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.org.createLocation(dto);
  }

  @Patch('locations/:id')
  @RequirePermission('organization.location:update')
  @ApiOperation({ summary: 'Update a location' })
  updateLocation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLocationDto) {
    return this.org.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @HttpCode(204)
  @RequirePermission('organization.location:delete')
  @ApiOperation({ summary: 'Soft-delete an empty location' })
  deleteLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.deleteLocation(id);
  }

  // ── outlets / floors / tables ─────────────────────────────────────────────

  @Get('outlets')
  @RequirePermission('organization.outlet:read')
  @ApiOperation({ summary: 'List outlets (revenue centers)' })
  listOutlets(@Query('locationId') locationId?: string) {
    return this.org.listOutlets(locationId);
  }

  @Get('outlets/:id')
  @RequirePermission('organization.outlet:read')
  @ApiOperation({ summary: 'Get an outlet with floor plan and terminals' })
  getOutlet(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.getOutlet(id);
  }

  @Post('outlets')
  @RequirePermission('organization.outlet:create')
  @ApiOperation({ summary: 'Create an outlet' })
  createOutlet(@Body() dto: CreateOutletDto) {
    return this.org.createOutlet(dto);
  }

  @Patch('outlets/:id')
  @RequirePermission('organization.outlet:update')
  @ApiOperation({ summary: 'Update an outlet' })
  updateOutlet(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOutletDto) {
    return this.org.updateOutlet(id, dto);
  }

  @Delete('outlets/:id')
  @HttpCode(204)
  @RequirePermission('organization.outlet:delete')
  @ApiOperation({ summary: 'Soft-delete an outlet' })
  deleteOutlet(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.deleteOutlet(id);
  }

  @Post('outlets/:id/floors')
  @RequirePermission('organization.table:manage')
  @ApiOperation({ summary: 'Add a floor to an outlet' })
  createFloor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateFloorDto) {
    return this.org.createFloor(id, dto);
  }

  @Delete('floors/:floorId')
  @HttpCode(204)
  @RequirePermission('organization.table:manage')
  @ApiOperation({ summary: 'Remove an empty floor' })
  deleteFloor(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.org.deleteFloor(floorId);
  }

  @Post('floors/:floorId/tables')
  @RequirePermission('organization.table:manage')
  @ApiOperation({ summary: 'Add a table (mints its QR-ordering token)' })
  createTable(@Param('floorId', ParseUUIDPipe) floorId: string, @Body() dto: CreateTableDto) {
    return this.org.createTable(floorId, dto);
  }

  @Patch('tables/:tableId')
  @RequirePermission('organization.table:manage')
  @ApiOperation({ summary: 'Update a table' })
  updateTable(@Param('tableId', ParseUUIDPipe) tableId: string, @Body() dto: UpdateTableDto) {
    return this.org.updateTable(tableId, dto);
  }

  // ── stores ────────────────────────────────────────────────────────────────

  @Get('stores')
  @RequirePermission('organization.store:read')
  @ApiOperation({ summary: 'List inventory-holding stores' })
  listStores(@Query('locationId') locationId?: string) {
    return this.org.listStores(locationId);
  }

  @Post('stores')
  @RequirePermission('organization.store:manage')
  @ApiOperation({ summary: 'Create a store' })
  createStore(@Body() dto: CreateStoreDto) {
    return this.org.createStore(dto);
  }

  @Patch('stores/:id')
  @RequirePermission('organization.store:manage')
  @ApiOperation({ summary: 'Update a store' })
  updateStore(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStoreDto) {
    return this.org.updateStore(id, dto);
  }

  // ── terminals ─────────────────────────────────────────────────────────────

  @Get('terminals')
  @RequirePermission('organization.terminal:read')
  @ApiOperation({ summary: 'List POS terminals' })
  listTerminals(@Query('outletId') outletId?: string) {
    return this.org.listTerminals(outletId);
  }

  @Post('terminals')
  @RequirePermission('organization.terminal:manage')
  @ApiOperation({ summary: 'Register a terminal (returns its pairing code)' })
  createTerminal(@Body() dto: CreateTerminalDto) {
    return this.org.createTerminal(dto);
  }

  @Patch('terminals/:id')
  @RequirePermission('organization.terminal:manage')
  @ApiOperation({ summary: 'Update or disable a terminal' })
  updateTerminal(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTerminalDto) {
    return this.org.updateTerminal(id, dto);
  }

  @Post('terminals/:id/activation-code')
  @RequirePermission('organization.terminal:manage')
  @ApiOperation({ summary: 'Rotate the terminal pairing code' })
  regenerateActivationCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.org.regenerateActivationCode(id);
  }
}
