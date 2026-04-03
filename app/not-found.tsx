import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-stone-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          Page not found
        </h1>
        <p className="text-stone-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
