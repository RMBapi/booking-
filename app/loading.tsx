export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto" />
        <p className="mt-4 text-stone-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
