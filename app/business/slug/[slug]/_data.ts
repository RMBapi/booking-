import { Business, Service } from "@/types";

/**
 * Server-side data fetching for the public business page.
 * Uses the full backend URL (not the /api proxy) so these work in RSC.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function fetchBusiness(slug: string): Promise<Business | null> {
  try {
    const res = await fetch(`${API_BASE}/business/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json: ApiResponse<Business> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchServices(slug: string): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE}/business/slug/${slug}/services`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json: ApiResponse<Service[]> = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];
    const activeServices = json.data.filter(
      (s) => s.status === "Active" && s.isActive,
    );
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[public services] ${slug}: ${json.data.length} returned, ${activeServices.length} active`,
      );
    }
    return activeServices;
  } catch {
    return [];
  }
}
