import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { TransactionType } from '../../../generated/client';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsDateString()
  occurredAt: string;
}
