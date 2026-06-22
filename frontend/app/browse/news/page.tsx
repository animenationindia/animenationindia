import NewsContent from '../../../components/NewsContent';

export default async function BrowseNewsPage() {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Anime News</h2>
        <p className="text-[#a0a0a0]">Real-time headlines and announcements from the anime industry.</p>
      </div>
      <div className="bg-[#000000]/50 rounded-2xl p-4 border border-white/5">
        <NewsContent />
      </div>
    </div>
  );
}
