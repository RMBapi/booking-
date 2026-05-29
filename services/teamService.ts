import { http } from "@/lib";
import type {
  AddTeamMemberPayload,
  AvailableFeature,
  TeamMember,
  UpdateTeamMemberPayload,
} from "@/types";

const unwrap = <T>(res: { data: unknown }): T => {
  const data = res.data as { data?: T } | T;
  return (
    (data as { data?: T })?.data !== undefined
      ? (data as { data: T }).data
      : (data as T)
  );
};

export const getTeam = async (businessId: string): Promise<TeamMember[]> => {
  const res = await http.get(`/business/${businessId}/team`);
  return unwrap<TeamMember[]>(res) ?? [];
};

export const addTeamMember = async (
  businessId: string,
  dto: AddTeamMemberPayload,
): Promise<TeamMember> => {
  const res = await http.post(`/business/${businessId}/team`, dto);
  return unwrap<TeamMember>(res);
};

export const updateTeamMember = async (
  businessId: string,
  userId: string,
  dto: UpdateTeamMemberPayload,
): Promise<TeamMember> => {
  const res = await http.patch(
    `/business/${businessId}/team/${userId}`,
    dto,
  );
  return unwrap<TeamMember>(res);
};

export const removeTeamMember = async (
  businessId: string,
  userId: string,
): Promise<void> => {
  await http.delete(`/business/${businessId}/team/${userId}`);
};

/**
 * Source of truth for feature labels + descriptions in the team UI.
 * Don't hardcode descriptions client-side.
 */
export const getAvailableFeatures = async (
  businessId: string,
): Promise<AvailableFeature[]> => {
  const res = await http.get(
    `/business/${businessId}/team/available-features`,
  );
  return unwrap<AvailableFeature[]>(res) ?? [];
};
