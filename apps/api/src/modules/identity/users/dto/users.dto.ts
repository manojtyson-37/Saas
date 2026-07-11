import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQuery } from '../../../../common/pagination';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Initial password; omit to send an invite' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one digit',
  })
  password?: string;

  @ApiPropertyOptional({ description: '4–6 digit POS PIN' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'posPin must be 4–6 digits' })
  posPin?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';

  @ApiPropertyOptional({ description: '4–6 digit POS PIN' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'posPin must be 4–6 digits' })
  posPin?: string;
}

export enum AssignmentScope {
  TENANT = 'TENANT',
  COMPANY = 'COMPANY',
  LOCATION = 'LOCATION',
}

export class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  roleId!: string;

  @ApiProperty({ enum: AssignmentScope })
  @IsEnum(AssignmentScope)
  scopeType!: AssignmentScope;

  @ApiPropertyOptional({ description: 'Required when scopeType=COMPANY' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Required when scopeType=LOCATION' })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}

export class ListUsersQuery extends PaginationQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
