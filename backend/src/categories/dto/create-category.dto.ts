import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TransactionType } from '../../../generated/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  color?: string;
}
