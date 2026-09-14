"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "내역" },
  { href: "/dashboard/budgets", label: "예산" },
  { href: "/dashboard/categories", label: "카테고리" },
];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold">가계부</span>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{user.name}님</span>
            <button onClick={logout} className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100">
              로그아웃
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
