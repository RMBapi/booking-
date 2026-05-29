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
  modalInputClass,
} from "@/components/ui";
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
    <ModalShell open={!!member} onClose={onClose} size="md">
      <ModalHeader
        title="Edit role"
        description={`${member.firstName} ${member.lastName}`}
        onClose={onClose}
      />
      <ModalBody className="space-y-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as BusinessRole)}
          className={modalInputClass}
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
          disabled={update.isPending || wouldDemoteLastOwner}
          isLoading={update.isPending}
        >
          Save
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
