"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  useAvailableFeatures,
  useUpdateTeamMember,
} from "./hooks";
import { PermissionPicker } from "./PermissionPicker";
import type { TeamMember } from "@/types";

interface Props {
  businessId: string;
  member: TeamMember | null;
  onClose: () => void;
}

export function EditPermissionsModal({ businessId, member, onClose }: Props) {
  const { data: features = [] } = useAvailableFeatures(businessId);
  const update = useUpdateTeamMember(businessId);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) setPermissions([...member.permissions]);
  }, [member]);

  if (!member) return null;
  const isOwner = member.role === "Business_owner";

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        userId: member.userId,
        dto: { permissions },
      });
      toast.success("Permissions updated");
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Could not save permissions.";
      setError(typeof message === "string" ? message : "Save failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <header className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Edit permissions
            </h2>
            <p className="text-sm text-stone-500">
              {member.firstName} {member.lastName} — {member.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          {isOwner && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm text-stone-600">
              Business owners get every feature automatically. Permission
              checkboxes are disabled.
            </div>
          )}

          <PermissionPicker
            features={features}
            selected={permissions}
            onChange={setPermissions}
            disabled={isOwner}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-300 text-stone-900 text-sm font-semibold px-4 py-2 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isOwner || update.isPending}
              className="rounded-lg bg-stone-900 text-white text-sm font-semibold px-4 py-2 hover:bg-stone-800 disabled:opacity-50"
            >
              {update.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
