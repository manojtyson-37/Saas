import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductionStatus } from '@aureus/database';

export class RecipeIngredientDto {
  @IsOptional() @IsUUID() itemId?: string;
  @IsOptional() @IsUUID() subRecipeId?: string;
  @IsNumber() @IsPositive() qty: number;
  @IsUUID() uomId: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) wastagePct?: number;
}

export class CreateRecipeDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @IsOptional() @IsUUID() outputItemId?: string;
  @IsOptional() @IsNumber() @IsPositive() yieldQty?: number;
  @IsOptional() @IsUUID() yieldUomId?: string;
  @IsOptional() @IsNumber() @IsPositive() portionSize?: number;
  @IsOptional() @IsString() @MaxLength(2000) instructions?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @IsUUID() outputItemId?: string;
  @IsOptional() @IsNumber() @IsPositive() yieldQty?: number;
  @IsOptional() @IsUUID() yieldUomId?: string;
  @IsOptional() @IsNumber() @IsPositive() portionSize?: number;
  @IsOptional() @IsString() @MaxLength(2000) instructions?: string;
}

export class SetRecipeIngredientsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}

export class CreateProductionOrderDto {
  @IsUUID() recipeId: string;
  @IsUUID() storeId: string;
  @IsNumber() @IsPositive() plannedQty: number;
  @IsDateString() businessDate: string;
}

export class CompleteProductionOrderDto {
  @IsNumber() @IsPositive() producedQty: number;
  @IsOptional() @IsNumber() @Min(0) actualCost?: number;
}

export class RecipeListQueryDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
  @IsOptional() @IsString() q?: string;
}

export class ProductionOrderQueryDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
  @IsOptional() @IsEnum(ProductionStatus) status?: ProductionStatus;
  @IsOptional() @IsUUID() storeId?: string;
  @IsOptional() @IsUUID() recipeId?: string;
}
