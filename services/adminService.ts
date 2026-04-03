import { http } from "@/lib";

export const getAllBusinessOwners = async () => {
  return http.get("/admin/business-owners");
};

export const toggleBusinessOwnerStatus = async (id: string, isActive: boolean) => {
  return http.patch(`/admin/user/${id}`, { isActive: !isActive });
};
