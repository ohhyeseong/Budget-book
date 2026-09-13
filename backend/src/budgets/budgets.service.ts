import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(userId: string, dto: UpsertBudgetDto) {
    return this.prisma.budget.upsert({
      where: {
        userId_categoryId_year_month: {
          userId,
          categoryId: dto.categoryId,
          year: dto.year,
          month: dto.month,
        },
      },
      create: { ...dto, userId },
      update: { amount: dto.amount },
    });
  }

  findByMonth(userId: string, year: number, month: number) {
    return this.prisma.budget.findMany({
      where: { userId, year, month },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.budget.deleteMany({ where: { id, userId } });
    return { success: true };
  }
}
