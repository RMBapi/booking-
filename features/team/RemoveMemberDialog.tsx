"use client";

import { toast } from "react-hot-toast";
import { useRemoveTeamMember } from "./hooks";
import type { TeamMember } from "@/types";

interface Props {
  businessId: string;
  member: TeamMember | null;
  onClose: () => void;
}

export function RemoveMemberDialog({ businessId, member, onClose }: Props) {
  const remove = useRemoveTeamMember(businessId);
  if (!member) return null;

  const handleConfirm = async () => {
    try {
      await remove.mutateAsync(member.userId);
      toast.success(`${member.firstName} removed`);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Could not remove member.";
      toast.error(typeof message === "string" ? message : "Remove failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <header className="px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">
            Remove team member?
          </h2>
        </header>
        <div className="px-6 py-5 space-y-3 text-sm text-stone-700">
          <p>
            Remove <strong>{member.firstName} {member.lastName}</strong> ({member.email})
            from this business? They'll lose access immediately. This can't be
            undone (you can re-invite them later).
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-300 text-stone-900 text-sm font-semibold px-4 py-2 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={remove.isPending}
              className="rounded-lg bg-red-600 text-white text-sm font-semibold px-4 py-2 hover:bg-red-700 disabled:opacity-50"
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
