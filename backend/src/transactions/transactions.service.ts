import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionType } from '../../generated/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        memo: dto.memo,
        occurredAt: new Date(dto.occurredAt),
        categoryId: dto.categoryId,
        userId,
      },
      include: { category: true },
    });
  }

  findAll(userId: string, query: QueryTransactionDto) {
    const { year, month, categoryId } = query;
    const where: Record<string, unknown> = { userId };

    if (categoryId) where.categoryId = categoryId;

    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.occurredAt = { gte: start, lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      where.occurredAt = { gte: start, lt: end };
    }

    return this.prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('내역을 찾을 수 없습니다.');
    if (transaction.userId !== userId) throw new ForbiddenException();
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOneOwned(userId, id);
    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOneOwned(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async summary(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: start, lt: end } },
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory = new Map<string, { categoryId: string; name: string; type: TransactionType; total: number }>();

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) totalIncome += amount;
      else totalExpense += amount;

      const key = t.categoryId;
      const existing = byCategory.get(key);
      if (existing) {
        existing.total += amount;
      } else {
        byCategory.set(key, {
          categoryId: t.categoryId,
          name: t.category.name,
          type: t.type,
          total: amount,
        });
      }
    }

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory: Array.from(byCategory.values()),
    };
  }
}
