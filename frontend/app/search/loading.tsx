import SearchSkeleton from '../../components/SearchSkeleton';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#050716] pt-24 pb-20 container mx-auto px-4 lg:px-12 w-full max-w-[1600px]">
      <SearchSkeleton />
    </div>
  );
}
