import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'shift-supervisor' })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,48}$/, {
    message: 'code must be lowercase kebab-case (2–49 chars)',
  })
  code!: string;

  @ApiProperty({ example: 'Shift Supervisor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({
    description: 'Permission grants: exact permissions or wildcard patterns (pos.*, inventory.item:*)',
    example: ['pos.order:create', 'pos.order:read', 'pos.payment:capture'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  grants!: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ description: 'Replaces the full grant list when provided' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  grants?: string[];
}
