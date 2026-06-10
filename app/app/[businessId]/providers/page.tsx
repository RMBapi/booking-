"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Star,
  CalendarCheck,
  Edit3,
  Trash2,
  Mail,
  Sparkles,
  UserCircle,
} from "lucide-react";
import {
  AddProviderModal,
  useServiceProviders,
} from "@/features/business-owner";
import { SearchInput } from "@/components/ui";
import { cn } from "@/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function ProvidersPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const { providers, isLoading } = useServiceProviders(businessId, {});
  const [search, setSearch] = useState("");
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);

  const filtered = providers.filter((p) => {
    const name =
      `${p.user?.firstName ?? p.firstName ?? ""} ${p.user?.lastName ?? p.lastName ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const stats = [
    {
      label: "Total Providers",
      value: providers.length,
      icon: Users,
      gradient: "from-[#D4A574]/20 to-[#D4A574]/5",
      iconColor: "text-[#D4A574]",
    },
    {
      label: "Total Bookings",
      value: "—",
      icon: CalendarCheck,
      gradient: "from-[#8BA88E]/20 to-[#8BA88E]/5",
      iconColor: "text-[#8BA88E]",
    },
  ];

  return (
    <div>
      <main className="flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">People</p>
            <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
              Team & Providers
            </h1>
            <p className="mt-1.5 text-sm text-text-tertiary">
              Manage your service providers and team members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddProviderOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 h-10 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 px-4",
              "text-sm font-semibold text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all",
              "hover:from-primary-600 hover:to-indigo-600 active:scale-[0.97]",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </button>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
              className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5 transition-colors hover:border-border-default"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                  stat.gradient,
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary tabular tracking-tight mt-0.5">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <SearchInput
            placeholder="Search providers by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-stone-200 border-t-[#D4A574]" />
          </div>
        )}

        {/* Provider Grid */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white py-20"
              >
                <Users className="h-10 w-10 text-stone-300" />
                <p className="mt-3 text-sm text-stone-400">
                  No providers found
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {filtered.map((provider, i) => {
                  const firstName =
                    provider.user?.firstName ?? provider.firstName ?? "";
                  const lastName =
                    provider.user?.lastName ?? provider.lastName ?? "";
                  const fullName =
                    `${firstName} ${lastName}`.trim() || "Unnamed Provider";
                  const email = provider.user?.email ?? "email@placeholder.com";
                  const avatar = provider.impUrl;

                  return (
                    <motion.div
                      key={provider.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      {/* Actions */}
                      <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button className="rounded-lg bg-stone-100 p-1.5 text-stone-500 transition hover:bg-[#D4A574]/10 hover:text-[#D4A574]">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg bg-stone-100 p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={fullName}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574]/20 to-[#8BA88E]/20">
                            <UserCircle className="h-5 w-5 text-[#D4A574]" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-stone-900">
                            {fullName}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-stone-500">
                            {provider.description ?? "Service Provider"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Mail className="h-3.5 w-3.5 text-stone-400" />
                          <span className="truncate">{email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Sparkles className="h-3.5 w-3.5 text-stone-400" />
                          <span>Specialties: General</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          <span>4.8 rating</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <AddProviderModal
        isOpen={isAddProviderOpen}
        onClose={() => setIsAddProviderOpen(false)}
        businessId={businessId}
      />
    </div>
  );
}
