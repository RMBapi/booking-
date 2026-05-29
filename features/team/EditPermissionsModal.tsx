"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/buttons";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  modalCancelButtonClass,
} from "@/components/ui";
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
    <ModalShell open={!!member} onClose={onClose} size="2xl">
      <ModalHeader
        title="Edit permissions"
        description={`${member.firstName} ${member.lastName} — ${member.email}`}
        onClose={onClose}
      />

      <ModalBody className="space-y-4">
        {isOwner && (
          <div className="bg-subtle/50 border border-border-subtle rounded-lg p-3 text-sm text-text-secondary">
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

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className={modalCancelButtonClass}>
          Cancel
        </button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isOwner || update.isPending}
          isLoading={update.isPending}
        >
          Save
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
