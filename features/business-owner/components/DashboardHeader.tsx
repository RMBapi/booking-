"use client";

import React from 'react';
import { Bell, User, Store } from 'lucide-react';
import { useRoleAuth } from '@/contexts';

export const DashboardHeader = () => {
  const { getSession } = useRoleAuth();
  const businessOwnerSession = getSession("Business_owner");
  const { user } = businessOwnerSession;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur-xl">
      <div className="bo-dashboard-shell flex h-20 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 shadow-lg shadow-teal-900/10">
            <Store className="h-5 w-5 text-stone-50" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-stone-800">Cuebites</span>
        </div>

        <div className="flex items-center gap-6">
          <button className="relative rounded-full p-2.5 text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-stone-300"></span>
          </button>

          <div className="h-6 w-px bg-stone-100"></div>

          <div className="group flex cursor-pointer items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-bold leading-none text-stone-700">
                {user?.firstName || "User"}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-stone-600">
                Administrator
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 shadow-inner transition-all group-hover:border-stone-200">
              <User className="h-6 w-6 text-stone-600 group-hover:text-stone-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
