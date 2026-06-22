import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Do Not Sell My Info | Anime Nation India',
  description: 'Do Not Sell or Share My Personal Information',
};

export default function DoNotSellPage() {
  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-[900px]">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 border-b border-[#2A2B30] pb-6">Do Not Sell or Share My Personal Information</h1>
        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          <p className="text-lg">Under certain US state privacy laws (such as the CCPA), you have the right to opt-out of the "sale" or "sharing" of your personal information to third parties.</p>
          
          <div className="bg-[#121326] p-6 rounded-xl border border-[#2A2B30] mt-8">
            <h3 className="text-xl text-white font-bold mb-4">Submit an Opt-Out Request</h3>
            <p className="mb-6">To exercise your right to opt-out, please fill out the form below or adjust your cookie preferences using our Cookie Consent Tool.</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                <input type="text" className="w-full bg-[#121214] border border-[#2A2B30] text-white rounded-lg px-4 py-2 focus:border-[#ff4dd2] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input type="email" className="w-full bg-[#121214] border border-[#2A2B30] text-white rounded-lg px-4 py-2 focus:border-[#ff4dd2] focus:outline-none" />
              </div>
              <div className="pt-2">
                <button type="button" className="bg-[#ff4dd2] hover:bg-[#ff4dd2] text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Process Opt-Out Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
