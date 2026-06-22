import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import MobileBottomNav from "../components/MobileBottomNav";
import BackButton from "../components/BackButton";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://animenationindia.online'),
  title: "Anime Nation India - Watch Anime,Live Schedule, Reviews & Watchlist, Discover & Get Full Details of Anime",
  description: "Anime Nation India is your ultimate free anime database and discovery platform. Get full details, watch official trailers, track release schedules, and build your custom watchlist for English Subbed and Dubbed Anime. Discover your next favorite anime today!",
  keywords: ["anime", "watch anime", "anime database", "anime release calendar", "anime tracker", "English subbed anime", "dubbed anime", "simulcast", "Anime Nation India", "ANI"],
  openGraph: {
    title: "Anime Nation India - Watch Anime,Live Schedule, Reviews & Watchlist, Discover & Get Full Details of Anime",
    description: "Anime Nation India is your ultimate free anime database and discovery platform. Get full details, watch official trailers, track release schedules, and build your custom watchlist.",
    siteName: "Anime Nation India",
    type: "website",
    images: [
      {
        url: "/ani-logo.png",
        width: 800,
        height: 600,
        alt: "Anime Nation India Logo",
      }
    ],
  },
  verification: {
    google: "Iy2BIme_V9-X_5NU_TMLqzs-PyR0x898Gkvdys1aSwg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anime Nation India",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="bg-[#050716] text-[#ffffff] min-h-screen flex flex-col font-sans selection:bg-[#ff4dd2] selection:text-white overflow-x-hidden w-full max-w-[100vw] pb-[60px] md:pb-0">
        <Navbar />
        <BackButton />
        {/* Main Content */}
        <div className="flex-grow w-full overflow-x-hidden relative">
          {children}
        </div>
        <Footer />
        <MobileBottomNav />
        <BackToTop />
      </body>
    </html>
  );
}