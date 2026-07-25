export default function MangaLoading() {
  return (
    <div className="min-h-screen bg-[#050716] pt-24 pb-20 w-full animate-pulse">
      <div className="relative w-full h-[400px] bg-[#121326]/40" />
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] -mt-[250px] relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="w-full lg:w-[260px] aspect-[2/3] bg-[#121326] rounded-xl border border-white/5 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-10 w-2/3 bg-[#121326] rounded-lg" />
            <div className="h-5 w-1/3 bg-[#121326] rounded-md" />
            <div className="h-24 w-full bg-[#121326] rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
