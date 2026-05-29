import { http } from "@/lib";
import type {
  BusinessOwner,
  CreateBusinessOwnerDto,
} from "@/types";

const unwrap = <T>(res: { data: unknown }): T => {
  const data = res.data as { data?: T } | T;
  return (data as { data?: T })?.data !== undefined
    ? (data as { data: T }).data
    : (data as T);
};

export const listBusinessOwners = async (): Promise<BusinessOwner[]> => {
  const res = await http.get("/admin/business-owners");
  return unwrap<BusinessOwner[]>(res) ?? [];
};

/**
 * POST /admin/business-owners — provisions an owner account only.
 * No business is created; no email is sent. The Super_Admin shares the
 * temporary password out-of-band.
 */
export const createBusinessOwner = async (dto: CreateBusinessOwnerDto) => {
  return http.post("/admin/business-owners", dto);
};

/**
 * PATCH /admin/business-owners/:userId/activation — flip the isActive
 * flag. Returns the updated user. Inactive accounts are blocked from
 * /auth/login (401 with "Account is inactive").
 */
export const setBusinessOwnerActivation = async (
  userId: string,
  isActive: boolean,
): Promise<BusinessOwner> => {
  const res = await http.patch(
    `/admin/business-owners/${userId}/activation`,
    { isActive },
  );
  return unwrap<BusinessOwner>(res);
};
