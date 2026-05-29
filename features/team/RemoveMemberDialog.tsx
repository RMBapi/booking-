"use client";

import { toast } from "react-hot-toast";
import {
  ModalBody,
  ModalHeader,
  ModalShell,
  modalDestructiveButtonClass,
  modalOutlineButtonClass,
} from "@/components/ui";
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
    <ModalShell open={!!member} onClose={onClose} size="md">
      <ModalHeader title="Remove team member?" onClose={onClose} />
      <ModalBody className="space-y-3 text-sm text-text-secondary">
        <p>
          Remove <strong>{member.firstName} {member.lastName}</strong> ({member.email})
          from this business? They&apos;ll lose access immediately. This can&apos;t be
          undone (you can re-invite them later).
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={modalOutlineButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={remove.isPending}
            className={modalDestructiveButtonClass}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </button>
        </div>
      </ModalBody>
    </ModalShell>
  );
}
