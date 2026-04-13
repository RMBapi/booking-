"use client";

import React from "react";
import { Bell, User } from "lucide-react";
import { useRoleAuth } from "@/contexts";

export const DashboardHeader = () => {
  const { getSession } = useRoleAuth();
  const businessOwnerSession = getSession("Business_owner");
  const { user } = businessOwnerSession;
  const displayName = user?.firstName
    ? `${user.firstName}${user?.lastName ? ` ${user.lastName[0]}.` : ""}`
    : "Alexander V.";

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-stone-200/50 bg-[#FDFCFB]/80 backdrop-blur-2xl">
      <div className="bo-dashboard-shell flex h-full items-center justify-end">
        <div className="flex items-center gap-4">
          <button className="relative rounded-xl p-2 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-900">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#FDFCFB] bg-[#B07D62]"></span>
          </button>

          <div className="h-6 w-px bg-stone-200"></div>

          <div className="group flex cursor-pointer items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-none text-stone-900 transition-colors group-hover:text-stone-600">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Business Owner
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 transition-all group-hover:border-stone-300">
              <User className="h-4 w-4 text-stone-400 group-hover:text-stone-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
