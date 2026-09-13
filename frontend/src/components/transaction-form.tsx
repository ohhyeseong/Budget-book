"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Category, Transaction, TransactionType } from "@/lib/types";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  onCreated,
  onClose,
}: {
  categories: Category[];
  onCreated: (transaction: Transaction) => void;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [memo, setMemo] = useState("");
  const [occurredAt, setOccurredAt] = useState(todayInputValue());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedCategoryId = categoryId || filteredCategories[0]?.id;
    if (!selectedCategoryId) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const transaction = await api.post<Transaction>(
        "/transactions",
        {
          amount: Number(amount),
          type,
          categoryId: selectedCategoryId,
          memo: memo || undefined,
          occurredAt: new Date(occurredAt).toISOString(),
        },
        token,
      );
      onCreated(transaction);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "내역 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">내역 추가</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700">
            닫기
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setCategoryId("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              type === "EXPENSE" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            지출
          </button>
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setCategoryId("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              type === "INCOME" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            수입
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">금액</label>
          <input
            type="number"
            required
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            placeholder="0"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">카테고리</label>
          <select
            value={categoryId || filteredCategories[0]?.id || ""}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">날짜</label>
          <input
            type="date"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">메모 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "추가 중..." : "추가"}
        </button>
      </form>
    </div>
  );
}
