import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../common/prisma.service';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create a tenant and its owner account (self-serve signup)' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.register(dto, requestMeta(req));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Email + password login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.login(dto, requestMeta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh token and mint a new access token' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, requestMeta(req));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke a refresh session' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current principal profile with tenant and roles' })
  async me(@CurrentUser() principal: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: { id: principal.userId, tenantId: principal.tenantId, deletedAt: null },
      include: {
        tenant: { select: { id: true, name: true, slug: true, status: true, plan: true } },
        assignments: {
          include: { role: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isTenantOwner: user.isTenantOwner,
      twoFactorEnabled: user.twoFactorEnabled,
      tenant: user.tenant,
      roles: user.assignments.map((a) => ({
        ...a.role,
        scopeType: a.scopeType,
        companyId: a.companyId,
        locationId: a.locationId,
      })),
    };
  }
}

function requestMeta(req: Request): { userAgent?: string; ip?: string } {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}
