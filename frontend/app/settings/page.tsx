/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSession, signOut, authClient } from '@/lib/auth-client';
import { logoutAction, verifyOtpCode } from '@/app/actions/auth';
import {
  getUserProfileDetails,
  updateUserProfile,
  changeUserPassword,
  requestPasswordReset,
  resetPasswordWithCode,
  requestAccountDeletionOtp,
  confirmDeleteUserAccountWithOtp,
  getUserTwoFactorDetails,
  toggleUserTwoFactorStatus,
  update2FADeliveryEmail,
  regenerateBackupCodes,
  getUserConnectedProviders,
} from '@/app/actions/profile';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  KeyRound,
  Lock,
  Mail,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Camera,
  LogOut,
  Sparkles,
  Globe,
  UploadCloud,
  Check,
  Copy,
  Download,
  Edit3,
  X,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Eye,
  EyeOff,
  Flame,
  Zap,
  Tv,
  AlertCircle,
  PlaySquare,
  Volume2,
  FastForward,
  SkipForward,
  Bell,
  Paintbrush,
  Sliders,
  History,
} from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

const AVATAR_PRESETS = [
  { id: 'crimson', name: 'Crimson Thunder', emoji: '⚡', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'flame', name: 'Flame Hashira', emoji: '🔥', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'cyber', name: 'Cyber Sage', emoji: '🌌', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'void', name: 'Void Director', emoji: '🎥', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'shadow', name: 'Shadow Monarch', emoji: '🕶️', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'star', name: 'Star Connoisseur', emoji: '⭐', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'binge', name: 'Binge Titan', emoji: '🍿', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'shinobi', name: 'Shinobi Sage', emoji: '🥷', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'dragon', name: 'Dragon Ruler', emoji: '🐉', bg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'playback' | 'appearance' | 'notifications' | 'privacy' | 'danger'
  >('profile');

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);

  // Profile Edit State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('cyber');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isPhotoTabCustom, setIsPhotoTabCustom] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetModalEmail, setResetModalEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 2FA State & Modals
  const [twoFactorState, setTwoFactorState] = useState<{
    enabled: boolean;
    deliveryEmail: string;
    backupCodesCount: number;
    backupCodes: string[];
  }>({
    enabled: false,
    deliveryEmail: '',
    backupCodesCount: 0,
    backupCodes: [],
  });
  const [enable2FAModalOpen, setEnable2FAModalOpen] = useState(false);
  const [enable2FAStep, setEnable2FAStep] = useState<'request' | 'verify' | 'codes'>('request');
  const [enable2FAEmail, setEnable2FAEmail] = useState('');
  const [enable2FACode, setEnable2FACode] = useState('');
  const [enable2FAResendCooldown, setEnable2FAResendCooldown] = useState(0);

  const [disable2FAModalOpen, setDisable2FAModalOpen] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');
  const [viewCodesModalOpen, setViewCodesModalOpen] = useState(false);
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
  const [changeEmailInput, setChangeEmailInput] = useState('');
  const [is2FAActionLoading, setIs2FAActionLoading] = useState(false);
  const [copiedCodesNotice, setCopiedCodesNotice] = useState(false);
  const [regenerateDialog, setRegenerateDialog] = useState(false);

  // Account Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm');
  const [deleteTargetEmail, setDeleteTargetEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteResendCooldown, setDeleteResendCooldown] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Connected Providers State
  const [providers, setProviders] = useState<any[]>([]);

  // Streaming / Playback Preferences
  const [playbackPrefs, setPlaybackPrefs] = useState({
    videoQuality: 'auto', // 'auto' | '1080p' | '720p' | '480p'
    defaultAudio: 'sub', // 'sub' | 'dub' | 'hi'
    autoSkipIntro: true,
    autoPlayNext: true,
  });

  // Appearance & Web Preferences
  const [appearancePrefs, setAppearancePrefs] = useState({
    theme: 'dark',
    splashScreen: true,
    autoScroll: true,
  });

  // Notifications Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    newEpisodeAlerts: true,
    emailNewsletters: false,
    pushNotifications: true,
    privateWatchlist: false,
  });

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cooldown timers
  useEffect(() => {
    if (enable2FAResendCooldown <= 0) return;
    const t = setInterval(() => setEnable2FAResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [enable2FAResendCooldown]);

  useEffect(() => {
    if (deleteResendCooldown <= 0) return;
    const t = setInterval(() => setDeleteResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [deleteResendCooldown]);

  // Load localStorage data & Preferences
  useEffect(() => {
    try {
      const uId = localStorage.getItem('user_id');
      const uName = localStorage.getItem('user_name');
      const uEmail = localStorage.getItem('user_email');
      const uRole = localStorage.getItem('user_role');
      const uAvatar = localStorage.getItem('user_avatar') || localStorage.getItem('ani_avatar');
      const uBio = localStorage.getItem('ani_user_bio') || '';

      if (uId && uEmail) {
        setLocalUser({ id: uId, name: uName || 'Otaku', email: uEmail, role: uRole || 'user', image: uAvatar });
        if (uName) setName(uName);
        if (uBio) setBio(uBio);
        if (uAvatar && !uAvatar.startsWith('http') && !uAvatar.startsWith('data:')) {
          setSelectedAvatarId(uAvatar);
        } else if (uAvatar) {
          setCustomPhotoUrl(uAvatar);
          setIsPhotoTabCustom(true);
        }
      }

      // Load playback prefs
      setPlaybackPrefs({
        videoQuality: localStorage.getItem('ani_pref_video_quality') || 'auto',
        defaultAudio: localStorage.getItem('ani_pref_default_audio') || 'sub',
        autoSkipIntro: localStorage.getItem('ani_pref_auto_skip_intro') !== 'false',
        autoPlayNext: localStorage.getItem('ani_pref_auto_play_next') !== 'false',
      });

      // Load appearance prefs
      setAppearancePrefs({
        theme: localStorage.getItem('theme') || 'dark',
        splashScreen: localStorage.getItem('splashScreenEnabled') !== 'false',
        autoScroll: localStorage.getItem('autoScrollEnabled') !== 'false',
      });

      // Load notification prefs
      setNotifPrefs({
        newEpisodeAlerts: localStorage.getItem('pref_newEpisodeAlerts') !== 'false',
        emailNewsletters: localStorage.getItem('pref_emailNewsletters') === 'true',
        pushNotifications: localStorage.getItem('pref_pushNotifications') !== 'false',
        privateWatchlist: localStorage.getItem('pref_privateWatchlist') === 'true',
      });
    } catch {}
  }, []);

  // Fetch initial profile & 2FA status from Server
  useEffect(() => {
    getUserProfileDetails().then((res) => {
      if (res.authenticated && res.user) {
        setProfileData(res);
        setName(res.user.name || '');
        setEnable2FAEmail(res.user.email || '');
        setDeleteTargetEmail(res.user.email || '');
        if (res.user.image?.startsWith('http') || res.user.image?.startsWith('data:')) {
          setCustomPhotoUrl(res.user.image);
          setIsPhotoTabCustom(true);
        } else if (res.user.image) {
          setSelectedAvatarId(res.user.image);
        }
      }
      setLoading(false);
    });

    getUserTwoFactorDetails().then((status) => {
      if (status.success) {
        setTwoFactorState({
          enabled: !!status.enabled,
          deliveryEmail: status.deliveryEmail || '',
          backupCodesCount: status.backupCodes?.length || 0,
          backupCodes: status.backupCodes || [],
        });
        if (status.deliveryEmail) {
          setEnable2FAEmail(status.deliveryEmail);
        }
      }
    });

    getUserConnectedProviders().then((res) => {
      if (res.success && res.providers) {
        setProviders(res.providers);
      }
    });
  }, [session?.user]);

  useEffect(() => {
    document.title = 'Settings & Preferences | Anime Nation India';
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutAction().catch(() => {});
      await signOut().catch(() => {});
    } catch {}
    [
      'user_token',
      'user_name',
      'user_id',
      'user_email',
      'user_role',
      'user_avatar',
      'ani_avatar',
      'token',
      'user',
    ].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
    router.refresh();
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Please enter a valid display name', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    const finalImage = isPhotoTabCustom && customPhotoUrl.trim() ? customPhotoUrl.trim() : selectedAvatarId;

    const res = await updateUserProfile({
      name: name.trim(),
      image: finalImage,
    });

    setIsUpdatingProfile(false);
    if (res.success) {
      notify('Profile identity updated successfully!');
      try {
        localStorage.setItem('user_name', name.trim());
        localStorage.setItem('ani_avatar', finalImage);
        localStorage.setItem('ani_user_bio', bio.trim());
        window.dispatchEvent(new CustomEvent('ani-avatar-changed', { detail: finalImage }));
        window.dispatchEvent(new Event('auth-change'));
      } catch {}
      router.refresh();
    } else {
      notify(res.error || 'Failed to update profile', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Image size must be less than 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoUrl(reader.result);
        setIsPhotoTabCustom(true);
        notify('Custom photo selected! Click Save Changes to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      notify('New password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notify('New passwords do not match', 'error');
      return;
    }

    setIsChangingPass(true);
    const res = await changeUserPassword({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
    setIsChangingPass(false);

    if (res.success) {
      notify('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      notify(res.error || 'Failed to change password', 'error');
    }
  };

  // Password Reset Flow
  const handleSendResetEmail = () => {
    const uEmail = session?.user?.email || profileData?.user?.email || localUser?.email || '';
    setResetModalEmail(uEmail);
    setResetSent(false);
    setResetCode('');
    setResetNewPass('');
    setResetModalOpen(true);
  };

  const handleSendResetOtpFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalEmail.trim()) return;
    setIsSendingReset(true);
    try {
      const res = await requestPasswordReset(resetModalEmail.trim().toLowerCase());
      if (res.success) {
        setResetSent(true);
        notify('6-digit reset code dispatched to your email!');
      } else {
        notify(res.error || 'Failed to send reset code', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error. Please try again.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalEmail.trim()) return;
    if (!resetCode.trim()) {
      notify('Please enter the 6-digit code', 'error');
      return;
    }
    if (resetNewPass.length < 6) {
      notify('Password must be at least 6 characters', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordWithCode({
        email: resetModalEmail.trim().toLowerCase(),
        code: resetCode.trim(),
        newPassword: resetNewPass,
      });
      if (res.success) {
        notify('Password successfully reset! Please sign in with new credentials.');
        setResetModalOpen(false);
        setResetSent(false);
        setResetCode('');
        setResetNewPass('');
      } else {
        notify(res.error || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Error completing reset.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // 2FA Activation Handlers
  const handleStartEnable2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = enable2FAEmail.trim() || session?.user?.email || profileData?.user?.email || localUser?.email || '';
    if (!targetEmail) {
      notify('Please enter an email address for 2FA', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    try {
      const { sendOtpEmail } = await import('@/app/actions/auth');
      const res = await sendOtpEmail({ email: targetEmail, type: '2fa' });
      setIs2FAActionLoading(false);

      if (res.success) {
        setEnable2FAStep('verify');
        setEnable2FAResendCooldown(60);
        notify('6-digit activation code sent to ' + targetEmail);
      } else {
        notify(res.error || 'Failed to send 2FA activation code', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Network error sending 2FA code', 'error');
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enable2FACode.trim() || enable2FACode.length !== 6) {
      notify('Please enter the 6-digit code', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    try {
      const targetEmail = enable2FAEmail.trim() || session?.user?.email || '';
      const verifyRes = await verifyOtpCode({
        email: targetEmail,
        code: enable2FACode.trim(),
        type: '2fa',
      });

      if (!verifyRes.success) {
        setIs2FAActionLoading(false);
        notify(verifyRes.error || 'Invalid 6-digit code', 'error');
        return;
      }

      const res = await toggleUserTwoFactorStatus({
        enabled: true,
        deliveryEmail: targetEmail,
      });

      setIs2FAActionLoading(false);
      if (res.success && res.backupCodes) {
        setTwoFactorState({
          enabled: true,
          deliveryEmail: res.deliveryEmail || targetEmail,
          backupCodesCount: res.backupCodes.length,
          backupCodes: res.backupCodes,
        });
        setEnable2FAStep('codes');
        notify('2FA successfully enabled! Please store your backup codes.');
      } else {
        notify(res.error || 'Failed to activate 2FA', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Error completing 2FA activation', 'error');
    }
  };

  const handleStartDisable2FA = async () => {
    setIs2FAActionLoading(true);
    try {
      const { sendOtpEmail } = await import('@/app/actions/auth');
      const targetEmail = twoFactorState.deliveryEmail || session?.user?.email || '';
      const res = await sendOtpEmail({ email: targetEmail, type: '2fa' });
      setIs2FAActionLoading(false);

      if (res.success) {
        setDisable2FAModalOpen(true);
        setDisable2FACode('');
        notify('Confirmation code dispatched to your 2FA email!');
      } else {
        notify(res.error || 'Failed to send confirmation code', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Error initiating 2FA disable', 'error');
    }
  };

  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FACode.trim()) {
      notify('Please enter the 6-digit confirmation code', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    try {
      const verifyRes = await verifyOtpCode({
        email: twoFactorState.deliveryEmail || session?.user?.email || '',
        code: disable2FACode.trim(),
        type: '2fa',
      });

      if (!verifyRes.success) {
        setIs2FAActionLoading(false);
        notify(verifyRes.error || 'Invalid confirmation code', 'error');
        return;
      }

      const res = await toggleUserTwoFactorStatus({ enabled: false });
      setIs2FAActionLoading(false);

      if (res.success) {
        setTwoFactorState((p) => ({ ...p, enabled: false, backupCodes: [], backupCodesCount: 0 }));
        setDisable2FAModalOpen(false);
        notify('Two-Factor Authentication disabled.');
      } else {
        notify(res.error || 'Failed to disable 2FA', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Error disabling 2FA', 'error');
    }
  };

  const performRegenerateCodes = async () => {
    setIs2FAActionLoading(true);
    const res = await regenerateBackupCodes();
    setIs2FAActionLoading(false);
    setRegenerateDialog(false);

    if (res.success && res.backupCodes) {
      setTwoFactorState((p) => ({
        ...p,
        backupCodesCount: res.backupCodes!.length,
        backupCodes: res.backupCodes!,
      }));
      setViewCodesModalOpen(true);
      notify('8 new backup recovery codes generated!');
    } else {
      notify(res.error || 'Failed to regenerate backup codes', 'error');
    }
  };

  const handleSaveDeliveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeEmailInput.trim()) {
      notify('Please enter a valid email address', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    const res = await update2FADeliveryEmail(changeEmailInput.trim());
    setIs2FAActionLoading(false);

    if (res.success) {
      setTwoFactorState((p) => ({ ...p, deliveryEmail: res.deliveryEmail || changeEmailInput.trim() }));
      setChangeEmailModalOpen(false);
      notify('2FA delivery email updated successfully!');
    } else {
      notify(res.error || 'Failed to update 2FA delivery email', 'error');
    }
  };

  const copyAllBackupCodes = (codes: string[]) => {
    const text =
      `Anime Nation India - Two-Factor Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || 'Otaku User'}\nGenerated: ${new Date().toLocaleString()}\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodesNotice(true);
    setTimeout(() => setCopiedCodesNotice(false), 3000);
    notify('Backup codes copied to clipboard!');
  };

  const downloadBackupCodesAsTxt = (codes: string[]) => {
    const text =
      `Anime Nation India - Two-Factor Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || 'Otaku User'}\nGenerated: ${new Date().toLocaleString()}\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animenation-2fa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Backup codes downloaded as .txt file!');
  };

  // Account Deletion Handlers
  const handleStartDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      notify('Please type DELETE in capital letters to confirm', 'error');
      return;
    }
    if (!deleteTargetEmail.trim()) {
      notify('Please enter your account email address', 'error');
      return;
    }
    if (!deletePassword.trim()) {
      notify('Please enter your account password', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await requestAccountDeletionOtp({
        email: deleteTargetEmail.trim(),
        password: deletePassword,
      });
      if (res.success) {
        setDeleteStep('otp');
        setDeleteResendCooldown(60);
        notify('6-digit deletion authorization code dispatched to your account email!');
      } else {
        notify(res.error || 'Failed to send deletion code', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error sending deletion code.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinalizeDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteOtp.trim() || deleteOtp.trim().length !== 6) {
      notify('Please enter the 6-digit deletion code', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await confirmDeleteUserAccountWithOtp(deleteOtp.trim());
      if (res.success) {
        try {
          await logoutAction().catch(() => {});
        } catch {}
        try {
          await signOut().catch(() => {});
        } catch {}
        [
          'user_token',
          'user_id',
          'user_name',
          'user_email',
          'user_role',
          'user_avatar',
          'ani_avatar',
          'token',
          'user',
        ].forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {}
        });
        window.dispatchEvent(new Event('auth-change'));
        router.push('/');
        router.refresh();
      } else {
        notify(res.error || 'Failed to delete account', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error deleting account.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Preference Handlers
  const handlePlaybackPrefChange = (key: keyof typeof playbackPrefs, value: any) => {
    setPlaybackPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(`ani_pref_${key}`, String(value));
      } catch {}
      return updated;
    });
    notify(`Playback setting updated: ${String(key)}`);
  };

  const handleAppearancePrefChange = (key: keyof typeof appearancePrefs, value: any) => {
    setAppearancePrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        if (key === 'theme') {
          localStorage.setItem('theme', String(value));
          if (value === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        } else if (key === 'splashScreen') {
          localStorage.setItem('splashScreenEnabled', String(value));
        } else if (key === 'autoScroll') {
          localStorage.setItem('autoScrollEnabled', String(value));
        }
      } catch {}
      return updated;
    });
    notify(`Appearance setting updated: ${String(key)}`);
  };

  const handleNotifPrefChange = (key: keyof typeof notifPrefs, value: any) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(`pref_${key}`, String(value));
      } catch {}
      return updated;
    });
    notify(`Preference updated: ${String(key)}`);
  };

  const handleClearWatchHistory = () => {
    if (window.confirm('Are you sure you want to clear your local watch progress history?')) {
      try {
        localStorage.removeItem('ani_watch_history');
        localStorage.removeItem('recently_watched');
        notify('Watch history cleared successfully.');
      } catch {}
    }
  };

  const userObject = profileData?.user || session?.user || localUser;

  if (isSessionLoading && loading && !localUser) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[#ff4dd2]" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Settings...</p>
        </div>
      </div>
    );
  }

  if (!userObject && !profileData?.authenticated) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center mx-auto text-[#ff4dd2] shadow-[0_0_30px_rgba(255,77,210,0.2)]">
            <SettingsIcon size={32} />
          </div>
          <h1 className="text-2xl font-black font-display uppercase tracking-tight text-white">Sign In Required</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Please sign in to configure your account, player settings, 2FA security shield, and privacy preferences.
          </p>
          <Link
            href="/signin?callbackUrl=/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-purple-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition shadow-lg shadow-[#ff4dd2]/25 cursor-pointer"
          >
            <span>Sign In to Anime Nation</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeAvatarObj = AVATAR_PRESETS.find((a) => a.id === selectedAvatarId) || AVATAR_PRESETS[2];

  return (
    <div className="min-h-screen bg-[#050716] text-white flex flex-col selection:bg-[#ff4dd2] selection:text-white">
      <Navbar />

      {/* Floating Status Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-200 ${
            notification.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300 shadow-emerald-900/40'
              : 'border-rose-500/40 bg-rose-950/90 text-rose-200 shadow-rose-900/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition mb-2"
            >
              <ArrowLeft size={14} /> Back to Otaku Profile
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white flex items-center gap-3">
              <SettingsIcon className="text-[#ff4dd2]" size={36} />
              <span>Control &amp; Settings</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff4dd2] border border-[#ff4dd2]/30 px-2.5 py-0.5 rounded-full bg-[#ff4dd2]/10 shadow-[0_0_15px_rgba(255,77,210,0.15)]">
                {userObject?.role === 'admin' ? 'Super Admin' : 'VIP Otaku'}
              </span>
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Settings Layout: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── SIDEBAR NAVIGATION ── */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <User size={18} className={activeTab === 'profile' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Profile &amp; Identity</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <Lock size={18} className={activeTab === 'security' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Security &amp; 2FA</span>
            </button>

            <button
              onClick={() => setActiveTab('playback')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'playback'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <PlaySquare size={18} className={activeTab === 'playback' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Player &amp; Streaming</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <Paintbrush size={18} className={activeTab === 'appearance' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Appearance &amp; Web</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <Bell size={18} className={activeTab === 'notifications' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Notifications &amp; Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-white hover:border-[#ff4dd2]/40'
              }`}
            >
              <Globe size={18} className={activeTab === 'privacy' ? 'text-[#ff4dd2]' : 'text-gray-500'} />
              <span>Connected &amp; Privacy</span>
            </button>

            <button
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                activeTab === 'danger'
                  ? 'bg-rose-950/40 border border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'bg-[#0e1026]/80 border border-white/5 text-gray-400 hover:text-rose-400 hover:border-rose-500/30'
              }`}
            >
              <Trash2 size={18} className={activeTab === 'danger' ? 'text-rose-400' : 'text-gray-500'} />
              <span>Danger Zone</span>
            </button>
          </div>

          {/* ── MAIN CONTENT AREA ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* ========================================================================= */}
            {/* TAB 1: PROFILE & IDENTITY                                                 */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in"
              >
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                    <User className="text-[#ff4dd2]" size={22} />
                    <span>Profile &amp; Otaku Identity</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Customize how your name, avatar, and bio appear across watch parties, reviews, and community rankings.
                  </p>
                </div>

                {/* Display Name */}
                <div className="max-w-md">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-950 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#ff4dd2] focus:ring-2 focus:ring-[#ff4dd2]/20"
                    />
                  </div>
                </div>

                {/* Bio / About Me */}
                <div className="max-w-xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Short Bio (About Me)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={250}
                    rows={3}
                    placeholder="Tell other otakus about your favorite anime, favorite genres, or quote..."
                    className="w-full rounded-xl border border-white/15 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-[#ff4dd2] focus:ring-2 focus:ring-[#ff4dd2]/20 resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-zinc-500 mt-1">
                    <span>{bio.length} / 250</span>
                  </div>
                </div>

                {/* Avatar Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Avatar Selection
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPhotoTabCustom(false)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                          !isPhotoTabCustom ? 'bg-[#ff4dd2] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Presets
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPhotoTabCustom(true)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                          isPhotoTabCustom ? 'bg-[#ff4dd2] text-black font-extrabold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Custom Photo
                      </button>
                    </div>
                  </div>

                  {!isPhotoTabCustom ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = selectedAvatarId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedAvatarId(preset.id)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'border-[#ff4dd2] bg-[#ff4dd2]/10 shadow-[0_0_15px_rgba(255,77,210,0.25)] ring-2 ring-[#ff4dd2]/30'
                                : 'border-white/10 bg-zinc-950 hover:bg-zinc-900 hover:border-white/20'
                            }`}
                          >
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${preset.bg}`}>
                              {preset.emoji}
                            </span>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white truncate">{preset.name}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                {isSelected ? 'Active' : 'Select'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-white/15 bg-zinc-950/60 space-y-4 max-w-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                          {customPhotoUrl ? (
                            <img src={customPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="text-zinc-500" size={24} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Upload Custom Avatar Photo</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">PNG, JPG, or WebP up to 2MB</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="flex-1 w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/15 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition cursor-pointer">
                          <UploadCloud size={16} />
                          <span>Choose Image File</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {customPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPhotoUrl('');
                              setIsPhotoTabCustom(false);
                            }}
                            className="px-4 h-11 rounded-xl border border-rose-500/30 bg-rose-950/30 text-xs font-bold text-rose-400 hover:bg-rose-900/40 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-2 rounded-xl bg-[#ff4dd2] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition shadow-lg shadow-[#ff4dd2]/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: SECURITY & TWO-FACTOR AUTHENTICATION (2FA)                         */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Change Password Card */}
                <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                        <KeyRound className="text-[#ff4dd2]" size={22} />
                        <span>Password &amp; Credentials</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Update your account password with end-to-end SHA-256 cloud encryption.
                      </p>
                    </div>
                    <Lock className="text-zinc-600 hidden sm:block" size={24} />
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Current Password (optional for OAuth)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12 w-full rounded-xl border border-white/15 bg-zinc-950 pl-11 pr-11 text-sm text-white outline-none transition focus:border-[#ff4dd2] focus:ring-2 focus:ring-[#ff4dd2]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition p-1"
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="h-12 w-full rounded-xl border border-white/15 bg-zinc-950 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#ff4dd2] focus:ring-2 focus:ring-[#ff4dd2]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className={`h-12 w-full rounded-xl border bg-zinc-950 pl-11 pr-10 text-sm text-white outline-none transition ${
                            confirmNewPassword
                              ? confirmNewPassword === newPassword
                                ? 'border-emerald-500/80 focus:border-emerald-400'
                                : 'border-rose-500/80 focus:border-rose-400'
                              : 'border-white/15 focus:border-[#ff4dd2]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPass}
                        className="flex items-center gap-2 rounded-xl bg-[#ff4dd2] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isChangingPass ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        <span>Update Password</span>
                      </button>
                    </div>
                  </form>

                  {/* Password Reset Section */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Forgot or want to reset password via Email?</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        We&apos;ll send a secure 6-digit OTP code to your registered email address.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                    >
                      <Mail size={14} />
                      <span>Send Reset Code</span>
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication (2FA) Complete Card */}
                <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3.5 rounded-2xl border shrink-0 ${
                          twoFactorState.enabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                            : 'bg-zinc-950 text-zinc-400 border-white/10'
                        }`}
                      >
                        <Shield size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                            Two-Factor Authentication (2FA)
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                              twoFactorState.enabled
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-zinc-900 text-zinc-400 border border-white/10'
                            }`}
                          >
                            {twoFactorState.enabled ? 'Active Protection' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                          Requires a 6-digit email OTP from{' '}
                          <strong className="text-[#ff4dd2] font-mono">animenationindia.support@gmail.com</strong> or an emergency backup code on every sign-in.
                        </p>
                      </div>
                    </div>

                    {!twoFactorState.enabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEnable2FAStep('request');
                          setEnable2FACode('');
                          setEnable2FAModalOpen(true);
                        }}
                        className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer"
                      >
                        <ShieldCheck size={16} />
                        <span>Enable 2FA</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartDisable2FA}
                        disabled={is2FAActionLoading}
                        className="shrink-0 flex items-center gap-2 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/40 border border-rose-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                      >
                        {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                        <span>Disable 2FA</span>
                      </button>
                    )}
                  </div>

                  {twoFactorState.enabled && (
                    <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Delivery Email Box */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-[#ff4dd2]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white">Delivery Email</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setChangeEmailInput(twoFactorState.deliveryEmail);
                              setChangeEmailModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-[#ff4dd2] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>Change</span>
                          </button>
                        </div>
                        <p className="text-xs font-mono font-bold text-white truncate bg-zinc-900 px-3 py-2 rounded-xl border border-white/5">
                          {twoFactorState.deliveryEmail || userObject?.email || 'otaku@animenationindia.online'}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-2">All 2FA OTP codes are dispatched here.</p>
                      </div>

                      {/* Emergency Backup Codes Box */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <KeyRound size={16} className="text-amber-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white">Backup Recovery Codes</span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            {twoFactorState.backupCodesCount || 8} / 8 Active
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewCodesModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View 8 Codes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegenerateDialog(true)}
                            disabled={is2FAActionLoading}
                            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                            title="Regenerate all 8 codes"
                          >
                            <RefreshCw size={13} className={is2FAActionLoading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Regenerate</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2">Emergency fallback if email delivery is delayed.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: PLAYER & STREAMING PREFERENCES                                     */}
            {/* ========================================================================= */}
            {activeTab === 'playback' && (
              <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                    <PlaySquare className="text-[#ff4dd2]" size={22} />
                    <span>Player &amp; Streaming Preferences</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Configure your anime playback options, audio language, and binge-watching skips.
                  </p>
                </div>

                {/* Default Video Quality */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Default Video Quality
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'auto', label: 'Auto (Adaptive)' },
                      { id: '1080p', label: '1080p FHD' },
                      { id: '720p', label: '720p HD' },
                      { id: '480p', label: '480p SD (Saver)' },
                    ].map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handlePlaybackPrefChange('videoQuality', q.id)}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                          playbackPrefs.videoQuality === q.id
                            ? 'border-[#ff4dd2] bg-[#ff4dd2]/15 text-white shadow-[0_0_15px_rgba(255,77,210,0.2)]'
                            : 'border-white/10 bg-zinc-950 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Audio / Subtitle */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Default Audio &amp; Dub Language
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'sub', label: 'Japanese (Original Sub)' },
                      { id: 'dub', label: 'English Dub' },
                      { id: 'hi', label: 'Hindi Dub (When Available)' },
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handlePlaybackPrefChange('defaultAudio', a.id)}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                          playbackPrefs.defaultAudio === a.id
                            ? 'border-[#ff4dd2] bg-[#ff4dd2]/15 text-white shadow-[0_0_15px_rgba(255,77,210,0.2)]'
                            : 'border-white/10 bg-zinc-950 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <SkipForward size={16} className="text-[#ff4dd2]" /> Auto-Skip Opening &amp; Outro (OP / ED)
                      </h4>
                      <p className="text-xs text-zinc-400">Automatically skip theme intros and ending credits when streaming.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlaybackPrefChange('autoSkipIntro', !playbackPrefs.autoSkipIntro)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        playbackPrefs.autoSkipIntro ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          playbackPrefs.autoSkipIntro ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FastForward size={16} className="text-[#ff4dd2]" /> Auto-Play Next Episode
                      </h4>
                      <p className="text-xs text-zinc-400">Automatically start the next episode after an episode finishes.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlaybackPrefChange('autoPlayNext', !playbackPrefs.autoPlayNext)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        playbackPrefs.autoPlayNext ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          playbackPrefs.autoPlayNext ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: APPEARANCE & WEB                                                   */}
            {/* ========================================================================= */}
            {activeTab === 'appearance' && (
              <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                    <Paintbrush className="text-[#ff4dd2]" size={22} />
                    <span>Appearance &amp; Web Experience</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Choose your visual theme, animation styles, and regional language.
                  </p>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    <button
                      type="button"
                      onClick={() => handleAppearancePrefChange('theme', 'dark')}
                      className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                        appearancePrefs.theme === 'dark'
                          ? 'border-[#ff4dd2] bg-zinc-950 shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                          : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                      }`}
                    >
                      <div className="w-full h-14 bg-gradient-to-r from-[#050716] via-[#10132b] to-[#ff4dd2]/20 rounded-xl mb-2 border border-white/10" />
                      <p className="text-xs font-bold text-white">Deep Space Obsidian (Dark)</p>
                      <p className="text-[10px] text-zinc-500">Default cyberpunk dark mode</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAppearancePrefChange('theme', 'light')}
                      className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                        appearancePrefs.theme === 'light'
                          ? 'border-[#ff4dd2] bg-zinc-950 shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                          : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                      }`}
                    >
                      <div className="w-full h-14 bg-gradient-to-r from-gray-100 to-indigo-100 rounded-xl mb-2 border border-gray-300" />
                      <p className="text-xs font-bold text-white">Neon Cyber Light</p>
                      <p className="text-[10px] text-zinc-500">High contrast daylight mode</p>
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">3D Cinematic Splash Screen</h4>
                      <p className="text-xs text-zinc-400">Play the cinematic 3D entrance animation on initial app startup.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAppearancePrefChange('splashScreen', !appearancePrefs.splashScreen)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        appearancePrefs.splashScreen ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          appearancePrefs.splashScreen ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white">Auto-Scroll Banners &amp; Sliders</h4>
                      <p className="text-xs text-zinc-400">Automatically scroll featured anime carousels and sliders.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAppearancePrefChange('autoScroll', !appearancePrefs.autoScroll)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        appearancePrefs.autoScroll ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          appearancePrefs.autoScroll ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white">Website Language</h4>
                      <p className="text-xs text-zinc-400">Change UI display language.</p>
                    </div>
                    <div className="relative z-20">
                      <LanguageSelector direction="bottom" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: NOTIFICATIONS & ALERTS                                             */}
            {/* ========================================================================= */}
            {activeTab === 'notifications' && (
              <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                    <Bell className="text-[#ff4dd2]" size={22} />
                    <span>Notification Preferences</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Control which updates, alerts, and newsletters you receive.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">New Airing Episode Alerts</h4>
                      <p className="text-xs text-zinc-400">Get notified when a new episode drops for anime in your watchlist.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefChange('newEpisodeAlerts', !notifPrefs.newEpisodeAlerts)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        notifPrefs.newEpisodeAlerts ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          notifPrefs.newEpisodeAlerts ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white">Email Anime Digest &amp; News</h4>
                      <p className="text-xs text-zinc-400">Receive weekly roundups of trending anime releases and schedule announcements.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefChange('emailNewsletters', !notifPrefs.emailNewsletters)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        notifPrefs.emailNewsletters ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          notifPrefs.emailNewsletters ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white">Browser Push Notifications</h4>
                      <p className="text-xs text-zinc-400">Enable desktop/mobile browser notifications for real-time alerts.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefChange('pushNotifications', !notifPrefs.pushNotifications)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                        notifPrefs.pushNotifications ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                          notifPrefs.pushNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: CONNECTED ACCOUNTS & PRIVACY                                       */}
            {/* ========================================================================= */}
            {activeTab === 'privacy' && (
              <div className="rounded-3xl border border-white/10 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
                    <Globe className="text-[#ff4dd2]" size={22} />
                    <span>Connected Providers &amp; Privacy Hub</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage third-party OAuth logins, database synchronization, and public visibility.
                  </p>
                </div>

                {/* Private Watchlist Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-950">
                  <div>
                    <h4 className="text-sm font-bold text-white">Private Watchlist &amp; Stats</h4>
                    <p className="text-xs text-zinc-400">Hide your watchlist and viewing statistics from public Otaku profiles.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifPrefChange('privateWatchlist', !notifPrefs.privateWatchlist)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                      notifPrefs.privateWatchlist ? 'bg-[#ff4dd2]' : 'bg-zinc-800 border border-white/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                        notifPrefs.privateWatchlist ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Google Provider Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Google OAuth</p>
                      <p className="text-[11px] text-zinc-400">
                        {providers.find((p) => p.id === 'google')?.connected ? 'Connected to Google Account' : 'Ready to link'}
                      </p>
                    </div>
                  </div>
                  {providers.find((p) => p.id === 'google')?.connected ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/settings' })}
                      className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white transition cursor-pointer"
                    >
                      Link Google
                    </button>
                  )}
                </div>

                {/* GitHub Provider Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                      <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">GitHub OAuth</p>
                      <p className="text-[11px] text-zinc-400">
                        {providers.find((p) => p.id === 'github')?.connected ? 'Connected to GitHub Account' : 'Ready to link'}
                      </p>
                    </div>
                  </div>
                  {providers.find((p) => p.id === 'github')?.connected ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/settings' })}
                      className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white transition cursor-pointer"
                    >
                      Link GitHub
                    </button>
                  )}
                </div>

                {/* Database Synchronization Indicator */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Neon Serverless PostgreSQL</p>
                      <p className="text-[11px] text-zinc-400">Live cloud sync for watchlist, ratings, and profile</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <CheckCircle2 size={12} /> Synchronized
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: DANGER ZONE                                                        */}
            {/* ========================================================================= */}
            {activeTab === 'danger' && (
              <div className="rounded-3xl border border-rose-500/30 bg-[#0e1026]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 animate-in fade-in">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                    <AlertTriangle size={26} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-display uppercase tracking-tight text-rose-400">
                      Danger Zone
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                      Irreversible account operations. Please proceed with caution.
                    </p>
                  </div>
                </div>

                {/* Clear Watch History */}
                <div className="pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <History size={16} className="text-amber-400" /> Clear Local Watch History
                    </h4>
                    <p className="text-xs text-zinc-400">Resets recently played episode timestamps and resume points.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearWatchHistory}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 transition cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>

                {/* Permanent Account Deletion */}
                <div className="pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Permanent Account Deletion</h4>
                    <p className="text-xs text-zinc-400">Wipes all your saved watchlists, reviews, 2FA credentials, and profile permanently.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('confirm');
                      setDeleteConfirmText('');
                      setDeleteOtp('');
                      setDeleteModalOpen(true);
                    }}
                    className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-md active:scale-95 cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setResetModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="text-[#ff4dd2]" size={22} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {!resetSent ? (
              <form onSubmit={handleSendResetOtpFromModal} className="space-y-4">
                <p className="text-xs text-zinc-400">
                  We will send a 6-digit verification code from <strong className="text-[#ff4dd2]">animenationindia.support@gmail.com</strong>.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={resetModalEmail}
                    onChange={(e) => setResetModalEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-[#ff4dd2]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff4dd2] text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSendingReset ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Code</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetWithCode} className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Enter the 6-digit code sent to <strong className="text-white">{resetModalEmail}</strong> and your new password.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 text-center font-mono text-xl font-bold tracking-widest text-white outline-none focus:border-[#ff4dd2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-[#ff4dd2]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting || resetCode.length !== 6 || resetNewPass.length < 6}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff4dd2] text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Confirm New Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2FA Enable Modal */}
      {enable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            if (enable2FAStep !== 'codes') setEnable2FAModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    {enable2FAStep === 'codes' ? 'Emergency Backup Codes' : 'Setup Two-Factor (2FA)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {enable2FAStep === 'request'
                      ? 'Confirm delivery email'
                      : enable2FAStep === 'verify'
                      ? 'Verify 6-digit security code'
                      : 'Save your 8 backup codes safely'}
                  </p>
                </div>
              </div>
              {enable2FAStep !== 'codes' && (
                <button
                  type="button"
                  onClick={() => setEnable2FAModalOpen(false)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {enable2FAStep === 'request' && (
              <form onSubmit={handleStartEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300">
                  We will send 6-digit verification codes to this email:
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    2FA Delivery Email
                  </label>
                  <input
                    type="email"
                    value={enable2FAEmail}
                    onChange={(e) => setEnable2FAEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={is2FAActionLoading}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Code</span>
                </button>
              </form>
            )}

            {enable2FAStep === 'verify' && (
              <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300">
                  Enter the 6-digit activation code sent to <strong className="text-cyan-400">{enable2FAEmail}</strong>:
                </p>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={enable2FACode}
                    onChange={(e) => setEnable2FACode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="h-14 w-full rounded-2xl border border-white/20 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-widest text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={is2FAActionLoading || enable2FACode.length !== 6}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Verify &amp; Activate 2FA</span>
                </button>
              </form>
            )}

            {enable2FAStep === 'codes' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                  ⚠️ <strong>Save these 8 backup recovery codes.</strong> Each can unlock your account if email access is lost.
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-900 border border-white/10">
                  {twoFactorState.backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-zinc-950 px-3 py-2 rounded-xl text-xs font-mono text-emerald-400 font-bold">
                      {idx + 1}. {code}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <Copy size={14} /> <span>{copiedCodesNotice ? 'Copied!' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <Download size={14} /> <span>Download .TXT</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEnable2FAModalOpen(false)}
                  className="w-full h-12 rounded-xl bg-[#ff4dd2] text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition cursor-pointer"
                >
                  I have saved my backup codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Backup Codes Modal */}
      {viewCodesModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setViewCodesModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <KeyRound className="text-amber-400" size={22} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">Emergency Backup Codes</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewCodesModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-900 border border-white/10 mb-4">
              {twoFactorState.backupCodes.map((c, i) => (
                <div key={i} className="bg-zinc-950 px-3 py-2 rounded-xl text-xs font-mono text-amber-400 font-bold">
                  {i + 1}. {c}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                className="h-10 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy size={14} /> <span>{copiedCodesNotice ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                className="h-10 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={14} /> <span>Download</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewCodesModalOpen(false);
                performRegenerateCodes();
              }}
              className="w-full h-10 rounded-xl bg-zinc-900 border border-amber-500/30 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> <span>Regenerate New Codes</span>
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {disable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setDisable2FAModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-rose-500/40 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert size={24} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight">Disable 2FA</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisable2FAModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
              <p className="text-xs text-zinc-300">
                Enter the 6-digit confirmation code sent to <strong className="text-white">{twoFactorState.deliveryEmail}</strong>:
              </p>
              <input
                type="text"
                maxLength={6}
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="h-12 w-full rounded-xl border border-rose-500/40 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-widest text-white outline-none focus:border-rose-400"
              />
              <button
                type="submit"
                disabled={is2FAActionLoading || disable2FACode.length !== 6}
                className="w-full h-11 rounded-xl bg-rose-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
              >
                {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>Confirm Disable 2FA</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change 2FA Email Modal */}
      {changeEmailModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setChangeEmailModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="text-[#ff4dd2]" size={20} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">Update 2FA Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setChangeEmailModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDeliveryEmail} className="space-y-4">
              <input
                type="email"
                value={changeEmailInput}
                onChange={(e) => setChangeEmailInput(e.target.value)}
                required
                placeholder="new-email@example.com"
                className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-[#ff4dd2]"
              />
              <button
                type="submit"
                disabled={is2FAActionLoading}
                className="w-full h-11 rounded-xl bg-[#ff4dd2] text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Save New Email</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal (2-Step) */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-zinc-950 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black font-display uppercase tracking-tight">
                  {deleteStep === 'confirm' ? 'Delete Account' : 'Confirm Deletion Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {deleteStep === 'confirm' ? (
              <form onSubmit={handleStartDeleteRequest} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ <strong>Irreversible:</strong> All your saved watchlists, ratings, and account data will be permanently deleted from Neon PostgreSQL.
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Account Login Email
                  </label>
                  <input
                    type="email"
                    value={deleteTargetEmail}
                    onChange={(e) => setDeleteTargetEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    required
                    className="h-12 w-full rounded-xl border border-rose-500/30 bg-zinc-900 px-4 text-sm font-bold text-rose-400 outline-none focus:border-rose-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="w-full h-12 rounded-xl bg-rose-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Deletion Code</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinalizeDeleteAccount} className="space-y-4">
                <p className="text-xs text-zinc-300">
                  Enter the 6-digit authorization code dispatched to <strong className="text-rose-400">{deleteTargetEmail}</strong>:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="h-14 w-full rounded-2xl border border-rose-500/40 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-widest text-white outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  disabled={isDeleting || deleteOtp.length !== 6}
                  className="w-full h-12 rounded-xl bg-rose-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>Permanently Delete My Account</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
