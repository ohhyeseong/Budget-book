"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Category, TransactionType } from "@/lib/types";

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const cats = await api.get<Category[]>("/categories", token);
    setCategories(cats);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.post<Category>("/categories", { name: name.trim(), type }, token);
      setCategories((prev) => [...prev, created]);
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "카테고리 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/categories/${id}`, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "카테고리 삭제에 실패했습니다.",
      );
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400">불러오는 중...</p>;
  }

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">카테고리 관리</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">이름</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            placeholder="예: 반려동물"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">종류</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          >
            <option value="EXPENSE">지출</option>
            <option value="INCOME">수입</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          추가
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryGroup title="수입 카테고리" items={incomeCategories} onDelete={onDelete} />
        <CategoryGroup title="지출 카테고리" items={expenseCategories} onDelete={onDelete} />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: Category[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-600">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">카테고리가 없어요.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{c.name}</span>
              <button
                onClick={() => onDelete(c.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
