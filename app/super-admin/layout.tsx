"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts";
import { cn } from "@/utils";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    if (me.user.systemRole !== "Super_Admin") {
      router.replace("/app");
    }
  }, [me, isLoading, router]);

  if (isLoading || !me || me.user.systemRole !== "Super_Admin") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 h-14 flex items-center justify-between">
          <Link
            href="/super-admin/business-owners"
            className="flex items-center gap-2 font-semibold text-gray-900"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Super Admin
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                {me.user.firstName.charAt(0)}
              </span>
              <span className="hidden sm:inline">
                {me.user.firstName} {me.user.lastName}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
                <button
                  onClick={async () => {
                    await logout();
                    router.replace("/login");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-1">
            <NavLink
              href="/super-admin/business-owners"
              icon={<Users className="h-4 w-4" />}
              active={pathname.startsWith("/super-admin/business-owners")}
            >
              Business Owners
            </NavLink>
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon,
  active,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
        active
          ? "bg-primary-600 text-white"
          : "text-gray-700 hover:bg-gray-100",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
