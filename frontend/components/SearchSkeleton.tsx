export default function SearchSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6 mb-16">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-b from-[#1a1b2e] to-[#0d0e1f]" />
          <div className="h-3 rounded bg-[#1a1b2e] w-4/5" />
          <div className="h-2.5 rounded bg-[#1a1b2e] w-2/5" />
        </div>
      ))}
    </div>
  );
}
