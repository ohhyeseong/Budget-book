"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Category, MonthSummary } from "@/lib/types";

interface Budget {
  id: string;
  categoryId: string;
  year: number;
  month: number;
  amount: string;
}

const formatWon = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export default function BudgetsPage() {
  const { token } = useAuth();
  const [{ year, month }, setYearMonth] = useState(currentYearMonth);

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [cats, budgetList, summary] = await Promise.all([
      api.get<Category[]>("/categories", token),
      api.get<Budget[]>(`/budgets?year=${year}&month=${month}`, token),
      api.get<MonthSummary>(`/transactions/summary?year=${year}&month=${month}`, token),
    ]);
    setCategories(cats.filter((c) => c.type === "EXPENSE"));
    setBudgets(budgetList);
    setDrafts(
      Object.fromEntries(budgetList.map((b) => [b.categoryId, String(Number(b.amount))])),
    );
    setSpentByCategory(
      Object.fromEntries(summary.byCategory.map((c) => [c.categoryId, c.total])),
    );
    setLoading(false);
  }, [token, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const saveBudget = async (categoryId: string) => {
    if (!token) return;
    const raw = drafts[categoryId];
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      setError("올바른 예산 금액을 입력해주세요.");
      return;
    }
    setError(null);
    setSavingId(categoryId);
    try {
      const saved = await api.post<Budget>("/budgets", { categoryId, year, month, amount }, token);
      setBudgets((prev) => {
        const rest = prev.filter((b) => b.categoryId !== categoryId);
        return [...rest, saved];
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "예산 저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400">불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setYearMonth(shiftMonth(year, month, -1))}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          aria-label="이전 달"
        >
          ‹
        </button>
        <h1 className="w-28 text-center text-lg font-semibold">
          {year}년 {month}월 예산
        </h1>
        <button
          onClick={() => setYearMonth(shiftMonth(year, month, 1))}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {categories.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
          지출 카테고리가 없어요. 카테고리 탭에서 먼저 추가해주세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((c) => {
            const spent = spentByCategory[c.id] ?? 0;
            const budget = budgets.find((b) => b.categoryId === c.id);
            const budgetAmount = budget ? Number(budget.amount) : null;
            const ratio = budgetAmount ? Math.min(spent / budgetAmount, 1) : 0;
            const overBudget = budgetAmount !== null && spent > budgetAmount;

            return (
              <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatWon(spent)}
                    {budgetAmount !== null && ` / ${formatWon(budgetAmount)}`}
                  </span>
                </div>

                {budgetAmount !== null && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${overBudget ? "bg-red-500" : "bg-gray-900"}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                )}
                {overBudget && (
                  <p className="mt-1 text-xs text-red-500">예산을 초과했어요.</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="예산 금액"
                    value={drafts[c.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-500"
                  />
                  <button
                    onClick={() => saveBudget(c.id)}
                    disabled={savingId === c.id}
                    className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
