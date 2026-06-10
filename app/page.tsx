"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG;

  useEffect(() => {
    if (envSlug) {
      router.replace(`/business/slug/${envSlug}`);
    }
  }, [router, envSlug]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {envSlug ? "Loading..." : "Missing business slug"}
        </p>
      </div>
    </div>
  );
}
