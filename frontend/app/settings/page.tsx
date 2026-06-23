'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '../../lib/config';
import { User, LogOut, Settings as SettingsIcon, Bell, Shield, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSelector from '../../components/LanguageSelector';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState({
    splashScreen: true,
    autoScroll: true,
    newEpisodeAlerts: true,
    emailNewsletters: false,
    pushNotifications: true,
    privateWatchlist: true,
  });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isSendingReset, setIsSendingReset] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const getUserData = () => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      const name = localStorage.getItem('user_name');
      
      if (!token || !userId) {
        router.push('/auth');
      } else {
        setUser({
          id: userId,
          email: '',
          user_metadata: {
            full_name: name || 'Otaku',
            avatar_url: null
          }
        });
        setUsername(name || '');
        
        const localSplash = localStorage.getItem('splashScreenEnabled');
        const localScroll = localStorage.getItem('autoScrollEnabled');
        
        setPreferences({
          splashScreen: localSplash !== 'false',
          autoScroll: localScroll !== 'false',
          newEpisodeAlerts: localStorage.getItem('pref_newEpisodeAlerts') !== 'false',
          emailNewsletters: localStorage.getItem('pref_emailNewsletters') === 'true',
          pushNotifications: localStorage.getItem('pref_pushNotifications') !== 'false',
          privateWatchlist: localStorage.getItem('pref_privateWatchlist') !== 'false',
        });
      }
      setLoading(false);
    };
    getUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  const handleUpdateProfile = () => {
    setIsUpdating(true);
    setUpdateMsg({ type: '', text: '' });
    try {
      localStorage.setItem('user_name', username);
      setUpdateMsg({ type: 'success', text: 'Username updated successfully!' });
      window.dispatchEvent(new Event('auth-change'));
      
      setUser((prev: any) => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          full_name: username
        }
      }));
    } catch (error: any) {
      setUpdateMsg({ type: 'error', text: error.message || 'Failed to update.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    if (key === 'splashScreen') {
      localStorage.setItem('splashScreenEnabled', String(newValue));
      return;
    }
    
    if (key === 'autoScroll') {
      localStorage.setItem('autoScrollEnabled', String(newValue));
      return;
    }

    localStorage.setItem(`pref_${key}`, String(newValue));
  };

  const handle2FA = () => alert("Two-Factor Authentication will be available in the next security update.");
  
  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
    if (confirmDelete) {
      alert("Account deletion request submitted to admin. You will be logged out.");
      handleLogout();
    }
  };

  const handleChangePassword = () => {
    setPasswordMsg({ type: 'error', text: 'Password updates are not supported for self-hosted MongoDB accounts.' });
  };

  const handleSendResetEmail = () => {
    setPasswordMsg({ type: 'error', text: 'Password reset is not configured for self-hosted database accounts.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050716] flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#ff4dd2]/30 border-t-[#ff4dd2] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-12 selection:bg-[#ff4dd2] selection:text-white">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1000px]">
        
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2 flex items-center justify-center md:justify-start gap-3">
            <SettingsIcon className="text-[#ff4dd2]" size={40} /> Account <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Settings</span>
          </h1>
          <p className="text-[#a0a0a0] text-sm md:text-base">Manage your profile, preferences, and account details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="col-span-1 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${
                activeTab === 'profile' 
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.2)]' 
                  : 'bg-[#121326] border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/50'
              }`}
            >
              <User size={20} className={activeTab === 'profile' ? 'text-[#ff4dd2]' : ''} /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${
                activeTab === 'general' 
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.2)]' 
                  : 'bg-[#121326] border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/50'
              }`}
            >
              <SettingsIcon size={20} className={activeTab === 'general' ? 'text-[#ff4dd2]' : ''} /> Web Settings
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${
                activeTab === 'appearance' 
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.2)]' 
                  : 'bg-[#121326] border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/50'
              }`}
            >
              <Paintbrush size={20} className={activeTab === 'appearance' ? 'text-[#ff4dd2]' : ''} /> Appearance
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${
                activeTab === 'notifications' 
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.2)]' 
                  : 'bg-[#121326] border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/50'
              }`}
            >
              <Bell size={20} className={activeTab === 'notifications' ? 'text-[#ff4dd2]' : ''} /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${
                activeTab === 'privacy' 
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.2)]' 
                  : 'bg-[#121326] border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/50'
              }`}
            >
              <Shield size={20} className={activeTab === 'privacy' ? 'text-[#ff4dd2]' : ''} /> Privacy & Security
            </button>
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-2">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326] p-6 md:p-10 rounded-2xl border border-[#ff4dd2]/20 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Profile Information</h2>
                
                {updateMsg.text && (
                  <div className={`p-3 rounded-lg mb-6 text-sm font-bold border ${updateMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                    {updateMsg.text}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-[#ff4dd2] text-sm font-bold mb-2 uppercase tracking-wider">Username</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 bg-[#050716] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#ff4dd2] transition-colors"
                        placeholder="Enter your new username..."
                      />
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdating || !username.trim() || username === user?.user_metadata?.full_name}
                        className="px-6 py-3 bg-[#ff4dd2] hover:bg-[#ff4dd2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#ff4dd2] text-sm font-bold mb-2 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="text" disabled value={user?.email || ''} 
                      className="w-full bg-[#050716] border border-white/10 rounded-lg p-3 text-gray-300 focus:outline-none opacity-70 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-2">Your email address is managed by your authentication provider.</p>
                  </div>

                  <div>
                    <label className="block text-[#ff4dd2] text-sm font-bold mb-2 uppercase tracking-wider">User ID</label>
                    <input 
                      type="text" disabled value={user?.id || ''} 
                      className="w-full bg-[#050716] border border-white/10 rounded-lg p-3 text-gray-500 text-sm focus:outline-none opacity-50 font-mono"
                    />
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">Danger Zone</h3>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-lg transition-all font-bold tracking-wide cursor-pointer"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GENERAL / WEB SETTINGS TAB */}
            {activeTab === 'general' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326] p-6 md:p-10 rounded-2xl border border-[#ff4dd2]/20 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Web Settings</h2>
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold mb-1">Auto-Scroll Feature</h3>
                      <p className="text-[#a0a0a0] text-sm">Automatically scroll banners and sliders on the website. Turn off to stop moving elements.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('autoScroll')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.autoScroll ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.autoScroll ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <h3 className="text-white font-bold mb-1">Website Language</h3>
                      <p className="text-[#a0a0a0] text-sm">Change the display language of the entire website.</p>
                    </div>
                    <div className="relative z-50">
                      <LanguageSelector direction="bottom" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326] p-6 md:p-10 rounded-2xl border border-[#ff4dd2]/20 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Appearance Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[#ff4dd2] text-sm font-bold mb-4 uppercase tracking-wider">App Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button className="p-4 rounded-xl border-2 border-[#ff4dd2] bg-[#050716] text-left transition-all">
                        <div className="w-full h-16 bg-gradient-to-br from-[#050716] to-[#ff4dd2]/20 rounded-md mb-3 border border-white/10"></div>
                        <p className="text-white font-bold text-sm text-center">Deep Space Neon</p>
                      </button>
                      <button className="p-4 rounded-xl border-2 border-white/10 bg-[#050716] hover:border-[#ff4dd2]/50 opacity-50 cursor-not-allowed text-left transition-all">
                        <div className="w-full h-16 bg-gradient-to-br from-white to-gray-200 rounded-md mb-3 border border-gray-300"></div>
                        <p className="text-gray-400 font-bold text-sm text-center">Light Mode (Soon)</p>
                      </button>
                      <button className="p-4 rounded-xl border-2 border-white/10 bg-[#050716] hover:border-[#ff4dd2]/50 opacity-50 cursor-not-allowed text-left transition-all">
                        <div className="w-full h-16 bg-gradient-to-br from-gray-900 to-red-900/50 rounded-md mb-3 border border-white/10"></div>
                        <p className="text-gray-400 font-bold text-sm text-center">Crimson Dark (Soon)</p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold mb-1">3D Splash Screen</h3>
                      <p className="text-[#a0a0a0] text-sm">Play the cinematic 3D entrance animation on startup.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('splashScreen')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.splashScreen ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.splashScreen ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326] p-6 md:p-10 rounded-2xl border border-[#ff4dd2]/20 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Notification Preferences</h2>
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold mb-1">New Episode Alerts</h3>
                      <p className="text-[#a0a0a0] text-sm">Get notified when a new episode drops for anime in your watchlist.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('newEpisodeAlerts')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.newEpisodeAlerts ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.newEpisodeAlerts ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <h3 className="text-white font-bold mb-1">Email Newsletters</h3>
                      <p className="text-[#a0a0a0] text-sm">Receive weekly roundups of top trending anime and news.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('emailNewsletters')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.emailNewsletters ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.emailNewsletters ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <h3 className="text-white font-bold mb-1">Push Notifications</h3>
                      <p className="text-[#a0a0a0] text-sm">Enable browser push notifications for instant updates.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('pushNotifications')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.pushNotifications ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.pushNotifications ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* PRIVACY & SECURITY TAB */}
            {activeTab === 'privacy' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326] p-6 md:p-10 rounded-2xl border border-[#ff4dd2]/20 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Privacy & Security</h2>
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold mb-1">Private Watchlist</h3>
                      <p className="text-[#a0a0a0] text-sm">Hide your watchlist and viewing history from public profiles.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('privateWatchlist')}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${preferences.privateWatchlist ? 'bg-[#ff4dd2]' : 'bg-[#1f2029] border border-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${preferences.privateWatchlist ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-white font-bold mb-4">Account Password</h3>
                    {passwordMsg.text && (
                      <div className={`p-3 rounded-lg mb-4 text-sm font-bold border ${passwordMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                        {passwordMsg.text}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)..."
                        className="flex-1 bg-[#050716] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#ff4dd2] transition-colors"
                      />
                      <button 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !newPassword}
                        className="px-6 py-3 bg-[#ff4dd2] hover:bg-[#ff4dd2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                    <button 
                      onClick={handleSendResetEmail}
                      disabled={isSendingReset}
                      className="text-[#ff4dd2] text-sm hover:underline font-medium transition-colors"
                    >
                      {isSendingReset ? 'Sending...' : 'Forgot password? Send reset link to email'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <h3 className="text-white font-bold mb-1">Two-Factor Authentication (2FA)</h3>
                      <p className="text-[#a0a0a0] text-sm">Add an extra layer of security to your account.</p>
                    </div>
                    <button onClick={handle2FA} className="px-4 py-2 border border-[#ff4dd2] text-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-[#050716] font-bold rounded-lg transition-colors text-sm cursor-pointer">
                      Enable
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-red-500 font-bold mb-2">Delete Account</h3>
                    <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button onClick={handleDeleteAccount} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-lg transition-all font-bold text-sm cursor-pointer">
                      Delete Your Account
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
