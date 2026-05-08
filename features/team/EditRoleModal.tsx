"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useUpdateTeamMember } from "./hooks";
import type { BusinessRole, TeamMember } from "@/types";

interface Props {
  businessId: string;
  member: TeamMember | null;
  members: TeamMember[];
  onClose: () => void;
}

export function EditRoleModal({
  businessId,
  member,
  members,
  onClose,
}: Props) {
  const update = useUpdateTeamMember(businessId);
  const [role, setRole] = useState<BusinessRole>("Service_Provider");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) setRole(member.role);
  }, [member]);

  if (!member) return null;

  const ownersCount = members.filter((m) => m.role === "Business_owner").length;
  const isLastOwner = member.role === "Business_owner" && ownersCount <= 1;
  const wouldDemoteLastOwner =
    isLastOwner && role === "Service_Provider";

  const handleSave = async () => {
    setError(null);
    if (wouldDemoteLastOwner) {
      setError("Cannot demote the last business owner.");
      return;
    }
    try {
      await update.mutateAsync({
        userId: member.userId,
        dto: { role },
      });
      toast.success("Role updated");
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Could not update role.";
      setError(typeof message === "string" ? message : "Update failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <header className="px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">Edit role</h2>
          <p className="text-sm text-stone-500">
            {member.firstName} {member.lastName}
          </p>
        </header>
        <div className="px-6 py-5 space-y-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as BusinessRole)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          >
            <option value="Business_owner" disabled={false}>
              Business owner
            </option>
            <option
              value="Service_Provider"
              disabled={isLastOwner}
              title={
                isLastOwner ? "Cannot demote the last business owner." : ""
              }
            >
              Service provider
              {isLastOwner ? " (last owner — disabled)" : ""}
            </option>
          </select>
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
              disabled={update.isPending || wouldDemoteLastOwner}
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
