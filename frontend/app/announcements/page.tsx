import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';

export default function AnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      title: "Welcome to the New Anime Nation India!",
      date: "October 15, 2026",
      category: "Site Updates",
      content: "We're thrilled to launch our brand new design! Everything has been rebuilt from the ground up for a faster, smoother, and more beautiful experience."
    },
    {
      id: 2,
      title: "Mobile App in Development",
      date: "September 28, 2026",
      category: "Future Plans",
      content: "Many of you have been asking, and we've listened. We are currently working on dedicated iOS and Android applications. Stay tuned for more updates!"
    },
    {
      id: 3,
      title: "New Community Features Added",
      date: "September 10, 2026",
      category: "Community",
      content: "You can now leave reviews, join community discussions, and find recommendations directly from the home page. Jump in and join the conversation!"
    }
  ];

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#f47521]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1000px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/home" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#f47521] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#f47521]/10 border border-[#f47521]/20 rounded-2xl">
              <Bell className="text-[#f47521]" size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f47521] to-[#ff4dd2] mb-2 uppercase tracking-tighter drop-shadow-lg">
                More Announcements
              </h1>
              <p className="text-[#a0a0a0] font-medium">Stay up to date with the latest news and updates about Anime Nation India.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {announcements.map((item) => (
            <div 
              key={item.id}
              className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col group hover:border-[#f47521]/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f47521]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[#f47521]/10 transition-colors" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white group-hover:text-[#f47521] transition-colors">{item.title}</h2>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300">
                    {item.category}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    {item.date}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
