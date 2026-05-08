export const MEMBER_STATUSES = ['Pending', 'Active', 'Deactivated'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
