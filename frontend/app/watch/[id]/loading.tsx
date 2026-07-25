export default function WatchLoading() {
  return (
    <div className="min-h-screen bg-[#050716] pt-20 pb-20 container mx-auto px-4 lg:px-12 w-full max-w-[1600px] animate-pulse">
      <div className="w-full aspect-video bg-[#121326] rounded-2xl border border-white/5 mb-6" />
      <div className="h-8 w-1/2 bg-[#121326] rounded-lg mb-3" />
      <div className="h-4 w-1/4 bg-[#121326] rounded-md" />
    </div>
  );
}
