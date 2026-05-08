"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import {
  addTeamMember,
  getAvailableFeatures,
  getTeam,
  removeTeamMember,
  updateTeamMember,
} from "@/services/teamService";
import type {
  AddTeamMemberPayload,
  UpdateTeamMemberPayload,
} from "@/types";

export const teamKey = (businessId: string) =>
  ["business", businessId, "team"] as const;
export const featuresKey = (businessId: string) =>
  ["business", businessId, "available-features"] as const;

export function useTeam(businessId: string) {
  return useQuery({
    queryKey: teamKey(businessId),
    queryFn: () => getTeam(businessId),
    enabled: !!businessId,
  });
}

export function useAvailableFeatures(businessId: string) {
  return useQuery({
    queryKey: featuresKey(businessId),
    queryFn: () => getAvailableFeatures(businessId),
    enabled: !!businessId,
    staleTime: 60 * 60 * 1000,
  });
}

function useAfterTeamMutation(businessId: string) {
  const qc = useQueryClient();
  const { refetchMe } = useAuth();
  return async () => {
    await qc.invalidateQueries({ queryKey: teamKey(businessId) });
    // Caller's own permissions may have changed — refresh /auth/me too.
    await refetchMe();
  };
}

export function useAddTeamMember(businessId: string) {
  const after = useAfterTeamMutation(businessId);
  return useMutation({
    mutationFn: (dto: AddTeamMemberPayload) =>
      addTeamMember(businessId, dto),
    onSuccess: after,
  });
}

export function useUpdateTeamMember(businessId: string) {
  const after = useAfterTeamMutation(businessId);
  return useMutation({
    mutationFn: ({
      userId,
      dto,
    }: {
      userId: string;
      dto: UpdateTeamMemberPayload;
    }) => updateTeamMember(businessId, userId, dto),
    onSuccess: after,
  });
}

export function useRemoveTeamMember(businessId: string) {
  const after = useAfterTeamMutation(businessId);
  return useMutation({
    mutationFn: (userId: string) => removeTeamMember(businessId, userId),
    onSuccess: after,
  });
}
