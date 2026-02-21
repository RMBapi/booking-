"use client";

import React from 'react';
import { Bell, User, Store } from 'lucide-react';
import { useRoleAuth } from '@/contexts';

export const DashboardHeader = () => {
  const { getSession } = useRoleAuth();
  const businessOwnerSession = getSession("Business_owner");
  const { user } = businessOwnerSession;
  const displayName = user?.firstName
    ? `${user.firstName}${user?.lastName ? ` ${user.lastName[0]}.` : ""}`
    : "Alexander V.";

  return (
    <header className="sticky top-0 z-50 h-24 border-b border-stone-100/50 bg-[#FDFCFB]/80 backdrop-blur-2xl">
      <div className="bo-dashboard-shell flex h-full items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 shadow-2xl shadow-stone-900/20">
            <Store className="h-6 w-6 text-stone-50" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold leading-none tracking-tight text-stone-900">BizMinder</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Admin Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button className="relative rounded-2xl p-3 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-900">
            <Bell className="h-5 w-5" />
            <span className="absolute right-3.5 top-3.5 h-2.5 w-2.5 rounded-full border-[3px] border-[#FDFCFB] bg-[#B07D62]"></span>
          </button>

          <div className="h-8 w-px bg-stone-100"></div>

          <div className="group flex cursor-pointer items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-[14px] font-bold leading-none text-stone-900 transition-colors group-hover:text-stone-600">
                {displayName}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Business Owner
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-100 shadow-inner ring-4 ring-stone-50/50 transition-all group-hover:border-stone-300">
              <User className="h-6 w-6 text-stone-400 group-hover:text-stone-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
