"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy route — contacts nav was replaced by Reviews. */
export default function ContactsRedirectPage() {
  const params = useParams<{ businessId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/app/${params.businessId}/reviews`);
  }, [params.businessId, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
    </div>
  );
}
