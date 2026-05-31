import { redirect } from "next/navigation";

export default function Home() {
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG;

  // Server-side redirect: resolves before any client JS ships, so first-time
  // visitors never pay for a bundle download + hydration + useEffect hop just
  // to be sent to the real business page. (next.config redirects() handles this
  // at the edge too; this is the runtime fallback.)
  if (envSlug) {
    redirect(`/business/slug/${envSlug}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-600">Missing business slug</p>
    </div>
  );
}
