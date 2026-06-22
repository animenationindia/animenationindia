'use client';

import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
      
      // Auto hide success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
      
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-4 tracking-wider">
            Get in <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Touch</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl mx-auto text-sm md:text-base">
            Connect with the community. Whether you have a question, feedback, or a feature suggestion, we'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 flex items-start gap-4 hover:border-[#ff4dd2]/50 transition-colors group">
              <div className="bg-[#ff4dd2]/10 p-3 rounded-xl group-hover:bg-[#ff4dd2]/20 transition-colors">
                <Mail className="text-[#ff4dd2]" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Email Us</h3>
                <p className="text-[#a0a0a0] text-sm">shouvikdaswork@gmail.com</p>
              </div>
            </div>

            <a href="https://shouvikdas-portfolio.vercel.app/portfolio" target="_blank" rel="noopener noreferrer" className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 flex items-start gap-4 hover:border-[#ffd54a]/50 transition-colors group block">
              <div className="bg-[#ffd54a]/10 p-3 rounded-xl group-hover:bg-[#ffd54a]/20 transition-colors">
                <ExternalLink className="text-[#ffd54a]" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Connect with Developer</h3>
                <p className="text-[#a0a0a0] text-sm">Visit my portfolio</p>
                <p className="text-[#ffd54a] text-xs mt-1">shouvikdas-portfolio.vercel.app</p>
              </div>
            </a>

            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 flex items-start gap-4 hover:border-[#f47521]/50 transition-colors group">
              <div className="bg-[#f47521]/10 p-3 rounded-xl group-hover:bg-[#f47521]/20 transition-colors">
                <MapPin className="text-[#f47521]" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Location</h3>
                <p className="text-[#a0a0a0] text-sm">India</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-10 relative">
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              
              <AnimatePresence>
                {submitStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 text-green-400"
                  >
                    <CheckCircle2 size={20} className="shrink-0" />
                    <p className="text-sm font-medium">Your message has been sent successfully. We'll get back to you soon!</p>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400"
                  >
                    <XCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Your Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      id="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Naruto Uzumaki"
                      disabled={isSubmitting}
                      required
                      className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff4dd2] focus:ring-1 focus:ring-[#ff4dd2] transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      id="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="naruto@hiddenleaf.com"
                      disabled={isSubmitting}
                      required
                      className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff4dd2] focus:ring-1 focus:ring-[#ff4dd2] transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    disabled={isSubmitting}
                    className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff4dd2] focus:ring-1 focus:ring-[#ff4dd2] transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Message <span className="text-red-500">*</span></label>
                  <textarea 
                    id="message" 
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message here..."
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff4dd2] focus:ring-1 focus:ring-[#ff4dd2] transition-all resize-none disabled:opacity-50"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#ff4dd2] to-[#ffd54a] text-white font-bold py-4 px-8 rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
