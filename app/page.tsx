"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components";

export default function Home() {
  const router = useRouter();
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG;

  useEffect(() => {
    if (envSlug) {
      router.replace(`/business/slug/${envSlug}`);
    }
  }, [router, envSlug]);

  if (envSlug) {
    return <PageLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-600">Missing business slug</p>
    </div>
  );
}
