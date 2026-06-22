'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Send } from 'lucide-react';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Report a Bug',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      // We prepend [FEEDBACK] to the subject so the admin knows it's from the feedback page
      const payload = {
        ...formData,
        subject: `[FEEDBACK] ${formData.subject}`
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: 'Report a Bug', message: '' }); // Reset form
      
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
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 pb-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ffd54a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[700px] relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 text-center">Content Feedback</h1>
        <p className="text-gray-400 mb-10 text-center">Notice something wrong? Have a suggestion? We'd love to hear from you.</p>
        
        <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-10 relative">
          
          <AnimatePresence>
            {submitStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 text-green-400"
              >
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm font-medium">Thank you! Your feedback has been submitted successfully.</p>
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
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Your Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="name" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff4dd2] transition-colors disabled:opacity-50"
                  placeholder="e.g. Ichigo Kurosaki"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  id="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff4dd2] transition-colors disabled:opacity-50"
                  placeholder="ichigo@soul-society.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <select 
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff4dd2] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <option value="Report a Bug">Report a Bug</option>
                <option value="Content Correction">Content Correction</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">Your Message <span className="text-red-500">*</span></label>
              <textarea 
                id="message"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                rows={6}
                className="w-full bg-[#050716] border border-[#2A2B30] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff4dd2] transition-colors disabled:opacity-50 resize-none"
                placeholder="Please provide details about the issue or suggestion..."
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#ff4dd2] hover:bg-[#ff4dd2] text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting Feedback...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
