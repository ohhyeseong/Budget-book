"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Category, MonthSummary, Transaction } from "@/lib/types";
import { TransactionForm } from "@/components/transaction-form";

const formatWon = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [{ year, month }, setYearMonth] = useState(currentYearMonth);

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [cats, txs, sum] = await Promise.all([
      api.get<Category[]>("/categories", token),
      api.get<Transaction[]>(`/transactions?year=${year}&month=${month}`, token),
      api.get<MonthSummary>(`/transactions/summary?year=${year}&month=${month}`, token),
    ]);
    setCategories(cats);
    setTransactions(txs);
    setSummary(sum);
    setLoading(false);
  }, [token, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    await api.delete(`/transactions/${id}`, token);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    load();
  };

  if (loading) {
    return <p className="text-sm text-gray-400">불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYearMonth(shiftMonth(year, month, -1))}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            aria-label="이전 달"
          >
            ‹
          </button>
          <h1 className="w-28 text-center text-lg font-semibold">
            {year}년 {month}월
          </h1>
          <button
            onClick={() => setYearMonth(shiftMonth(year, month, 1))}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + 내역 추가
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">수입</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">
              {formatWon(summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">지출</p>
            <p className="mt-1 text-lg font-semibold text-red-600">
              {formatWon(summary.totalExpense)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">잔액</p>
            <p className="mt-1 text-lg font-semibold">{formatWon(summary.balance)}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-600">
          내역
        </div>
        {transactions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            이번 달 내역이 없어요. 내역을 추가해보세요.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {t.category.name}
                    {t.memo && <span className="ml-2 text-gray-400">{t.memo}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.occurredAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      t.type === "INCOME" ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatWon(Number(t.amount))}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          onCreated={handleCreated}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
