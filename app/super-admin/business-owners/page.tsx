"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/buttons";
import { Badge, Skeleton, Switch } from "@/components/ui";
import {
  listBusinessOwners,
  setBusinessOwnerActivation,
} from "@/services/adminService";
import { formatDate } from "@/utils";
import type { BusinessOwner } from "@/types";

type OwnerStatus = "Inactive" | "Pending first login" | "Onboarding" | "Active";

function ownerStatus(o: BusinessOwner): OwnerStatus {
  if (!o.isActive) return "Inactive";
  if (o.passwordChangeRequired) return "Pending first login";
  if (!o.userBusinesses || o.userBusinesses.length === 0) return "Onboarding";
  return "Active";
}

const STATUS_BADGE: Record<OwnerStatus, "secondary" | "warning" | "default" | "success"> = {
  Inactive: "secondary",
  "Pending first login": "warning",
  Onboarding: "default",
  Active: "success",
};

export default function BusinessOwnersListPage() {
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    listBusinessOwners()
      .then((rows) => {
        if (!cancelled) setOwners(rows);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load business owners.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter((o) => {
      const name = `${o.firstName} ${o.lastName}`.toLowerCase();
      return name.includes(q) || o.email.toLowerCase().includes(q);
    });
  }, [owners, query]);

  const handleToggle = async (owner: BusinessOwner, next: boolean) => {
    // Optimistic update
    const prev = owners;
    setOwners((rows) =>
      rows.map((r) => (r.id === owner.id ? { ...r, isActive: next } : r)),
    );
    setPendingIds((s) => new Set(s).add(owner.id));
    try {
      const updated = await setBusinessOwnerActivation(owner.id, next);
      // Reconcile with server-returned shape (preserves any fields the
      // PATCH may have touched besides isActive).
      setOwners((rows) =>
        rows.map((r) => (r.id === owner.id ? { ...r, ...updated } : r)),
      );
      toast.success(next ? "Activated" : "Deactivated");
    } catch (err: unknown) {
      // Roll back
      setOwners(prev);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not update activation.";
      toast.error(typeof message === "string" ? message : "Update failed.");
    } finally {
      setPendingIds((s) => {
        const next2 = new Set(s);
        next2.delete(owner.id);
        return next2;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Owners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision owner accounts and toggle access. Owners self-onboard
            their business on first login.
          </p>
        </div>
        <Button asChild size="lg" leftIcon={<Plus className="h-4 w-4" />}>
          <Link href="/super-admin/business-owners/new">Create owner</Link>
        </Button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          owners.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-6 py-3">Owner</th>
                  <th className="text-left px-6 py-3">Phone</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Active</th>
                  <th className="text-left px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const status = ownerStatus(o);
                  return (
                    <tr
                      key={o.id}
                      className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                            {o.firstName.charAt(0)}
                            {o.lastName.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {o.firstName} {o.lastName}
                            </div>
                            <div className="text-gray-500 text-xs truncate">
                              {o.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {o.phone ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_BADGE[status]}>{status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={o.isActive}
                          onCheckedChange={(next) => handleToggle(o, next)}
                          disabled={pendingIds.has(o.id)}
                          label={`Toggle activation for ${o.firstName} ${o.lastName}`}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonRows() {
  return (
    <div className="px-6 py-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/4" />
          </div>
          <Skeleton variant="text" className="h-4 w-20" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-4">
        <Users className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">
        No business owners yet
      </h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
        Create the first owner — they'll set their password on first login and
        onboard their business themselves.
      </p>
      <div className="mt-6">
        <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
          <Link href="/super-admin/business-owners/new">Create owner</Link>
        </Button>
      </div>
    </div>
  );
}
