"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  CircleSlash,
  Clock,
  Pencil,
  PlayCircle,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { FeatureGate } from "@/components/auth/FeatureGate";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useAuth } from "@/contexts";
import { AddMemberModal } from "@/features/team/AddMemberModal";
import { EditPermissionsModal } from "@/features/team/EditPermissionsModal";
import { EditRoleModal } from "@/features/team/EditRoleModal";
import { RemoveMemberDialog } from "@/features/team/RemoveMemberDialog";
import { useTeam, useUpdateTeamMember } from "@/features/team/hooks";
import {
  ActionMenu,
  type ActionMenuItem,
  COL,
  DataTable,
  type DataTableColumn,
  DataTableEmptyState,
  PersonCell,
  StatusPill,
  type StatusTone,
} from "@/components/ui";
import type { BusinessRole, MemberStatus, TeamMember } from "@/types";

const STATUS_LABEL: Record<MemberStatus, string> = {
  Active: "Active",
  Pending: "Pending",
  Deactivated: "Deactivated",
};

const STATUS_TONE: Record<MemberStatus, StatusTone> = {
  Active: "success",
  Pending: "warning",
  Deactivated: "danger",
};

export default function TeamPage() {
  return (
    <FeatureGate feature="manage_team" fallback={<AccessDenied />}>
      <TeamContent />
    </FeatureGate>
  );
}

function TeamContent() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const { me, activeMembership } = useAuth();
  const { data: team = [], isLoading } = useTeam(businessId);
  const updateMember = useUpdateTeamMember(businessId);

  const [addOpen, setAddOpen] = useState(false);
  const [editPerms, setEditPerms] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<TeamMember | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [recentlyInvitedEmail, setRecentlyInvitedEmail] = useState<string | null>(null);

  // Clear the highlight after the fade animation finishes (1.5s).
  useEffect(() => {
    if (!recentlyInvitedEmail) return;
    const t = window.setTimeout(() => setRecentlyInvitedEmail(null), 1600);
    return () => window.clearTimeout(t);
  }, [recentlyInvitedEmail]);

  const callerRole: BusinessRole =
    activeMembership?.role ?? "Service_Provider";
  const ownersCount = useMemo(
    () => team.filter((m) => m.role === "Business_owner").length,
    [team],
  );
  const activeOwnersCount = useMemo(
    () =>
      team.filter(
        (m) => m.role === "Business_owner" && m.status === "Active",
      ).length,
    [team],
  );

  const handleStatusChange = async (
    member: TeamMember,
    status: MemberStatus,
  ) => {
    try {
      await updateMember.mutateAsync({
        userId: member.userId,
        dto: { status },
      });
      toast.success(
        `${member.firstName || member.email} marked ${STATUS_LABEL[status]}`,
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Couldn't update status.";
      toast.error(typeof message === "string" ? message : "Couldn't update status.");
    }
  };

  const businessName = activeMembership?.name ?? "Team";

  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: "member",
      header: "Member",
      width: COL.person,
      cell: (m) => (
        <PersonCell
          avatar={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[11px] font-semibold">
              {(m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "")}
            </span>
          }
          name={`${m.firstName} ${m.lastName}`}
          secondary={m.email}
        />
      ),
    },
    {
      key: "email",
      header: "Email",
      width: COL.email,
      truncate: true,
      cell: (m) => (
        <span className="text-sm text-text-secondary block truncate" title={m.email}>
          {m.email}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: COL.short,
      cell: (m) => (
        <StatusPill tone={m.role === "Business_owner" ? "info" : "neutral"} withDot={false}>
          {m.role.replace(/_/g, " ")}
        </StatusPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: COL.status,
      cell: (m) => (
        <StatusPill tone={STATUS_TONE[m.status]}>
          {STATUS_LABEL[m.status]}
        </StatusPill>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      width: COL.short,
      cell: (m) => (
        <span className="text-text-secondary tabular text-sm">
          {m.permissions.length} of 14
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: COL.action,
      cell: (m) => {
        const isSelf = m.userId === me?.user.id;
        const isLastOwner = m.role === "Business_owner" && ownersCount <= 1;
        const isLastActiveOwner =
          m.role === "Business_owner" &&
          m.status === "Active" &&
          activeOwnersCount <= 1;
        const removeDisabled = isSelf || isLastOwner;
        const removeTitle = isSelf
          ? "Ask another owner to remove you."
          : isLastOwner
          ? "Cannot remove the last business owner."
          : undefined;

        // Backend rejects: changing your own status, or demoting the last
        // active business owner. Mirror those guards in the menu.
        const demoteBlocked = isSelf || isLastActiveOwner;
        const demoteTitle = isSelf
          ? "You can't change your own status."
          : isLastActiveOwner
          ? "Cannot demote the last active business owner."
          : undefined;
        const activateBlocked = isSelf;
        const activateTitle = isSelf
          ? "You can't change your own status."
          : undefined;

        const statusItems: ActionMenuItem[] = [];
        if (m.status !== "Active") {
          statusItems.push({
            key: "set-active",
            label: "Activate",
            icon: <PlayCircle />,
            onClick: () => handleStatusChange(m, "Active"),
            disabled: activateBlocked,
            title: activateTitle,
          });
        }
        if (m.status !== "Pending") {
          statusItems.push({
            key: "set-pending",
            label: "Mark Pending",
            icon: <Clock />,
            onClick: () => handleStatusChange(m, "Pending"),
            disabled: demoteBlocked,
            title: demoteTitle,
          });
        }
        if (m.status !== "Deactivated") {
          statusItems.push({
            key: "set-deactivated",
            label: "Deactivate",
            icon: <CircleSlash />,
            onClick: () => handleStatusChange(m, "Deactivated"),
            disabled: demoteBlocked,
            danger: true,
            title: demoteTitle,
          });
        }

        const items: ActionMenuItem[] = [
          {
            key: "edit-perms",
            label: "Edit permissions",
            icon: <Shield />,
            onClick: () => setEditPerms(m),
          },
          {
            key: "edit-role",
            label: "Edit role",
            icon: <UserCog />,
            onClick: () => setEditRole(m),
          },
          ...(statusItems.length
            ? [{ key: "status-divider", label: "", divider: true } as ActionMenuItem, ...statusItems]
            : []),
          { key: "remove-divider", label: "", divider: true },
          {
            key: "remove",
            label: "Remove",
            icon: <Trash2 />,
            onClick: () => setRemoveMember(m),
            disabled: removeDisabled,
            danger: true,
            title: removeTitle,
          },
        ];
        return <ActionMenu items={items} triggerLabel={`Actions for ${m.firstName}`} />;
      },
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{businessName}</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">Team</h1>
          <p className="text-sm text-text-tertiary mt-1.5">
            Manage who can access this business and what they can do.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-sm font-semibold px-4 py-2 hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
        >
          Add member
        </button>
      </header>

      <DataTable
        columns={columns}
        data={team}
        rowKey={(m) => m.userId}
        isLoading={isLoading}
        loadingRows={4}
        rowClassName={(m) =>
          recentlyInvitedEmail && m.email === recentlyInvitedEmail
            ? "row-highlight"
            : undefined
        }
        emptyState={
          <DataTableEmptyState
            icon={<Users />}
            title="No team members yet"
            description="Invite your first teammate to start collaborating."
            action={
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
              >
                <Pencil className="h-3 w-3" />
                Add member
              </button>
            }
          />
        }
      />

      <AddMemberModal
        businessId={businessId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        callerRole={callerRole}
        onInvited={(email) => setRecentlyInvitedEmail(email)}
      />
      <EditPermissionsModal
        businessId={businessId}
        member={editPerms}
        onClose={() => setEditPerms(null)}
      />
      <EditRoleModal
        businessId={businessId}
        member={editRole}
        members={team}
        onClose={() => setEditRole(null)}
      />
      <RemoveMemberDialog
        businessId={businessId}
        member={removeMember}
        onClose={() => setRemoveMember(null)}
      />
    </div>
  );
}
