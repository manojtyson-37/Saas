import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({ example: 'growth' })
  @IsString()
  @MaxLength(30)
  planCode!: string;
}
