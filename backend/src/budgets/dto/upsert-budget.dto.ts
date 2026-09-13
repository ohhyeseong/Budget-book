import { IsInt, IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class UpsertBudgetDto {
  @IsUUID()
  categoryId: string;

  @IsInt()
  @Min(2000)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @IsPositive()
  amount: number;
}
