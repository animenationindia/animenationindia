'use client';

import { useState } from 'react';
import { 
  ShieldAlert, 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Link as LinkIcon, 
  FileText, 
  Clock, 
  Info, 
  ArrowLeft,
  AlertOctagon,
  Sparkles,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const violationCategories = [
  { id: 'Harassment / Bullying', label: 'Harassment / Bullying', desc: 'Direct insults, toxic behavior, threats, or stalking other users.' },
  { id: 'Hate Speech', label: 'Hate Speech', desc: 'Racism, sexism, homophobia, xenophobia, or promoting hate.' },
  { id: 'Untagged Spoilers', label: 'Untagged Spoilers', desc: 'Spoiling major anime/manga events in comments or discussion threads.' },
  { id: 'NSFW / Explicit Content', label: 'NSFW / Explicit Content', desc: 'Uploading or linking suggestive or pornographic media.' },
  { id: 'Piracy Links', label: 'Piracy Links', desc: 'Posting links to illegal download portals or unofficial streams.' },
  { id: 'Other Violation', label: 'Other / Custom Issue', desc: 'Impersonation, spamming, fake leaks, or anything else.' }
];

export default function ReportViolationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    violationCategory: '',
    targetUser: '',
    violationUrl: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, violationCategory: category }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.violationCategory || !formData.description) {
      setErrorMessage('Please fill in all required fields (Name, Email, Category, Description).');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/report-violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitStatus('success');
      setFormData({ 
        name: '', 
        email: '', 
        violationCategory: '', 
        targetUser: '', 
        violationUrl: '', 
        description: '' 
      }); // Reset form
      
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#03040b] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Laser Cybersecurity Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444405_1px,transparent_1px),linear-gradient(to_bottom,#ef444405_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Security Scanning Line */}
      <motion.div 
        animate={{ translateY: ['0vh', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent pointer-events-none z-0"
      />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Navigation back link */}
        <Link 
          href="/guidelines"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10 group cursor-pointer"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          Back to Community Guidelines
        </Link>

        {/* Page Header */}
        <div className="text-left mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-black uppercase tracking-widest mb-4">
            <ShieldAlert size={14} className="animate-pulse" />
            Safety Response Center
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            Report a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500">Violation</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            Spotted someone breaking our community guidelines? Let us know. Your report is kept strictly confidential and will be evaluated by our moderation team immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Unique Security Dashboard Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0e0f22]/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
              <h3 className="text-white font-black text-xl tracking-tight uppercase flex items-center gap-2 border-b border-white/5 pb-4">
                <AlertOctagon size={20} className="text-red-500" /> Report Policy
              </h3>
              
              <div className="flex flex-col gap-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">Quick Evaluation</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Our moderator team typically reviews and acts on reports within 2-4 hours during peak hours.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">Confidentiality</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">The reported user will never know who filed the complaint. All reports remain anonymous to the public.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">Strict Action</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Verified offenses result in instant warnings, mute blocks, or permanent IP address banishment.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Notice</span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Filing deliberately false or malicious reports against other members is a direct violation of our code and will result in your own account being flagged or banned.
                </p>
              </div>
            </div>

            <div className="bg-[#0c0d1e]/30 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ff4dd2] shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-0.5">Looking for general help?</h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  For technical errors or account features, please visit our <Link href="/contact" className="text-[#ff4dd2] hover:underline">Contact Page</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Violation Report Form */}
          <div className="lg:col-span-8">
            <div className="bg-[#0e0f22]/60 backdrop-blur-xl border border-white/5 hover:border-red-500/10 transition-colors rounded-3xl p-6 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
              
              <AnimatePresence mode="wait">
                {submitStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 flex flex-col items-center justify-center text-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mb-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                      <CheckCircle2 size={40} className="animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Report Logged</h3>
                    <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                      Thank you for helping us keep the community clean. Our safety team has received the details and will evaluate the issue shortly.
                    </p>
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs border border-white/10 cursor-pointer transition-colors"
                    >
                      File Another Report
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Status alerts */}
                    <AnimatePresence>
                      {submitStatus === 'error' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400"
                        >
                          <XCircle size={20} className="shrink-0" />
                          <p className="text-sm font-semibold">{errorMessage}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Step 1: Category Selection */}
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertOctagon size={14} className="text-red-500" /> 1. Select Violation Category <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {violationCategories.map((cat) => {
                          const isSelected = formData.violationCategory === cat.id;
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => handleCategorySelect(cat.id)}
                              className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 select-none cursor-pointer ${
                                isSelected 
                                  ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                  : 'bg-[#03040b]/50 hover:bg-[#03040b] border-white/5 hover:border-white/10'
                              }`}
                            >
                              <span className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {cat.label}
                              </span>
                              <span className="text-gray-500 text-xs mt-1.5 leading-relaxed font-medium">
                                {cat.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Form Inputs */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">
                        2. Contact & Target Information
                      </h4>

                      {/* Reporter Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Name <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            id="name" 
                            value={formData.name}
                            onChange={handleTextChange}
                            placeholder="e.g. Shouvik Das"
                            disabled={isSubmitting}
                            required
                            className="w-full bg-[#03040b]/60 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 text-white rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Email <span className="text-red-500">*</span></label>
                          <input 
                            type="email" 
                            id="email" 
                            value={formData.email}
                            onChange={handleTextChange}
                            placeholder="you@email.com"
                            disabled={isSubmitting}
                            required
                            className="w-full bg-[#03040b]/60 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 text-white rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50 text-sm"
                          />
                        </div>
                      </div>

                      {/* Target User & Violation Link */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="targetUser" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <UserX size={12} className="text-red-500" /> Target Username
                          </label>
                          <input 
                            type="text" 
                            id="targetUser" 
                            value={formData.targetUser}
                            onChange={handleTextChange}
                            placeholder="Username of violator (if known)"
                            disabled={isSubmitting}
                            className="w-full bg-[#03040b]/60 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 text-white rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="violationUrl" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon size={12} className="text-red-500" /> Page Link / URL
                          </label>
                          <input 
                            type="url" 
                            id="violationUrl" 
                            value={formData.violationUrl}
                            onChange={handleTextChange}
                            placeholder="Episode or forum page link"
                            disabled={isSubmitting}
                            className="w-full bg-[#03040b]/60 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 text-white rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50 text-sm"
                          />
                        </div>
                      </div>

                      {/* Description & Evidence */}
                      <div className="space-y-2">
                        <label htmlFor="description" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText size={12} className="text-red-500" /> Description & Evidence Details <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          id="description" 
                          rows={5}
                          value={formData.description}
                          onChange={handleTextChange}
                          placeholder="Provide descriptive details, comments text, context, or any other proof to help our moderation team act quickly..."
                          disabled={isSubmitting}
                          required
                          className="w-full bg-[#03040b]/60 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 text-white rounded-xl px-4 py-3 focus:outline-none transition-all resize-none disabled:opacity-50 text-sm leading-relaxed"
                        ></textarea>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white font-extrabold uppercase py-4 px-8 rounded-xl w-full flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 shadow-lg tracking-widest text-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting Report...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          File Safety Report
                        </>
                      )}
                    </button>

                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
