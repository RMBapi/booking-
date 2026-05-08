"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { postLoginPath } from "@/lib/postLoginRedirect";

export default function Home() {
  const router = useRouter();
  const { me, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace("/login");
    } else {
      router.replace(postLoginPath(me));
    }
  }, [me, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading…</p>
      </div>
    </div>
  );
}
