export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string | null;
}

export interface Transaction {
  id: string;
  amount: string;
  type: TransactionType;
  memo: string | null;
  occurredAt: string;
  categoryId: string;
  category: Category;
}

export interface MonthSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: {
    categoryId: string;
    name: string;
    type: TransactionType;
    total: number;
  }[];
}
