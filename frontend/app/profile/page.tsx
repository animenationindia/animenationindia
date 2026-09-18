/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSession, signOut, authClient } from '@/lib/auth-client';
import { logoutAction } from '@/app/actions/auth';
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
  Bookmark,
  Heart,
  MessageSquare,
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
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'crimson', name: 'Crimson Thunder', emoji: '⚡', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30 ring-rose-500/30' },
  { id: 'flame', name: 'Flame Hashira', emoji: '🔥', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-amber-500/30' },
  { id: 'cyber', name: 'Cyber Sage', emoji: '🌌', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 ring-cyan-500/30' },
  { id: 'void', name: 'Void Director', emoji: '🎥', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30 ring-purple-500/30' },
  { id: 'shadow', name: 'Shadow Monarch', emoji: '🕶️', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 ring-indigo-500/30' },
  { id: 'star', name: 'Star Connoisseur', emoji: '⭐', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ring-yellow-500/30' },
  { id: 'binge', name: 'Binge Titan', emoji: '🍿', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30 ring-pink-500/30' },
  { id: 'shinobi', name: 'Shinobi Sage', emoji: '🥷', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-emerald-500/30' },
  { id: 'dragon', name: 'Dragon Ruler', emoji: '🐉', bg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 ring-fuchsia-500/30' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'connected' | 'danger'>('profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [name, setName] = useState('');
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

  // Password Reset State
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

  // Account Deletion State (2-Step Email OTP Flow)
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

  // Status Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Resend Countdowns
  useEffect(() => {
    if (enable2FAResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setEnable2FAResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [enable2FAResendCooldown]);

  useEffect(() => {
    if (deleteResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setDeleteResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [deleteResendCooldown]);

  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    try {
      const uId = localStorage.getItem('user_id');
      const uName = localStorage.getItem('user_name');
      const uEmail = localStorage.getItem('user_email');
      const uRole = localStorage.getItem('user_role');
      const uAvatar = localStorage.getItem('user_avatar') || localStorage.getItem('ani_avatar');
      if (uId && uEmail) {
        setLocalUser({
          id: uId,
          name: uName || 'Otaku Explorer',
          email: uEmail,
          role: uRole || 'user',
          image: uAvatar,
        });
        if (uName) setName(uName);
        if (uAvatar && !uAvatar.startsWith('http') && !uAvatar.startsWith('data:')) {
          setSelectedAvatarId(uAvatar);
        } else if (uAvatar) {
          setCustomPhotoUrl(uAvatar);
          setIsPhotoTabCustom(true);
        }
      }
    } catch {}
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutAction().catch(() => {});
      await signOut().catch(() => {});
    } catch {}
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('ani_avatar');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
    router.refresh();
  };

  // Fetch initial profile stats and info
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

    // Fetch 2FA Status from PostgreSQL
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

    // Fetch Connected Providers
    getUserConnectedProviders().then((res) => {
      if (res.success && res.providers) {
        setProviders(res.providers);
      }
    });
  }, [session?.user]);

  useEffect(() => {
    document.title = 'Account & Security | Anime Nation India';
  }, []);

  // Handle Profile Update
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
      notify('Otaku profile updated successfully!');
      try {
        localStorage.setItem('ani_avatar', finalImage);
        window.dispatchEvent(new CustomEvent('ani-avatar-changed', { detail: finalImage }));
      } catch {}
      router.refresh();
    } else {
      notify(res.error || 'Failed to update profile', 'error');
    }
  };

  // Handle Custom Image File Upload
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

  // Handle Password Change
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

  // Handle Password Reset — open modal with email prefilled
  const handleSendResetEmail = () => {
    const userEmail = session?.user?.email || profileData?.user?.email || localUser?.email || '';
    setResetModalEmail(userEmail);
    setResetSent(false);
    setResetCode('');
    setResetNewPass('');
    setResetModalOpen(true);
  };

  // Handle Send OTP to the modal email
  const handleSendResetOtpFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalEmail.trim()) return;
    setIsSendingReset(true);
    try {
      const res = await requestPasswordReset(resetModalEmail.trim().toLowerCase());
      if (res.success) {
        setResetSent(true);
        notify('6-digit reset code sent to your email!');
      } else {
        notify(res.error || 'Failed to send reset code', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error. Please try again.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Handle Password Reset Completion
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
        notify('Password has been successfully reset!');
        setResetModalOpen(false);
        setResetSent(false);
        setResetCode('');
        setResetNewPass('');
      } else {
        notify(res.error || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error resetting password. Please try again.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // =========================================================================
  // 🛡️ 2FA HANDLERS
  // =========================================================================

  // Step 1: Request 2FA Enable OTP
  const handleStartEnable2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIs2FAActionLoading(true);
    try {
      const { sendOtpEmail } = await import('@/app/actions/auth');
      const res = await sendOtpEmail({
        email: enable2FAEmail,
        type: '2fa',
        userName: session?.user?.name || 'Otaku',
      });
      setIs2FAActionLoading(false);

      if (res.success) {
        setEnable2FAStep('verify');
        setEnable2FAResendCooldown(60);
        notify('6-digit activation code sent to your email!');
      } else {
        notify(res.error || 'Failed to send activation code', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Failed to request 2FA code', 'error');
    }
  };

  // Step 2: Confirm 2FA Enable OTP & Receive 8 Backup Codes
  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enable2FACode.trim() || enable2FACode.trim().length !== 6) {
      notify('Please enter the 6-digit activation code', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    try {
      const { verifyOtpCode } = await import('@/app/actions/auth');
      const verifyRes = await verifyOtpCode({
        email: enable2FAEmail,
        code: enable2FACode.trim(),
        type: '2fa',
      });

      if (!verifyRes.success) {
        setIs2FAActionLoading(false);
        notify(verifyRes.error || 'Invalid or expired 2FA code', 'error');
        return;
      }

      // Activate 2FA in DB
      const res = await toggleUserTwoFactorStatus({ enabled: true });
      if (enable2FAEmail !== session?.user?.email) {
        await update2FADeliveryEmail(enable2FAEmail);
      }
      setIs2FAActionLoading(false);

      if (res.success && res.backupCodes) {
        setTwoFactorState({
          enabled: true,
          deliveryEmail: enable2FAEmail,
          backupCodesCount: res.backupCodes.length,
          backupCodes: res.backupCodes,
        });
        setEnable2FAStep('codes');
        notify('Two-Factor Authentication activated successfully!');
      } else {
        notify(res.error || 'Failed to activate 2FA in database', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Error during 2FA activation', 'error');
    }
  };

  // Request Disable 2FA
  const handleStartDisable2FA = async () => {
    setIs2FAActionLoading(true);
    try {
      const { sendOtpEmail } = await import('@/app/actions/auth');
      const res = await sendOtpEmail({
        email: twoFactorState.deliveryEmail || session?.user?.email || '',
        type: '2fa',
        userName: session?.user?.name || 'Otaku',
      });
      setIs2FAActionLoading(false);

      if (res.success) {
        setDisable2FAModalOpen(true);
        setDisable2FACode('');
        notify('Confirmation code sent to your 2FA email!');
      } else {
        notify(res.error || 'Failed to send confirmation code', 'error');
      }
    } catch (err: any) {
      setIs2FAActionLoading(false);
      notify(err?.message || 'Error initiating 2FA disable', 'error');
    }
  };

  // Confirm Disable 2FA
  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FACode.trim()) {
      notify('Please enter the 6-digit confirmation code', 'error');
      return;
    }

    setIs2FAActionLoading(true);
    try {
      const { verifyOtpCode } = await import('@/app/actions/auth');
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
        setTwoFactorState((prev) => ({ ...prev, enabled: false, backupCodes: [], backupCodesCount: 0 }));
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

  // Regenerate Backup Codes
  const performRegenerateCodes = async () => {
    setIs2FAActionLoading(true);
    const res = await regenerateBackupCodes();
    setIs2FAActionLoading(false);
    setRegenerateDialog(false);

    if (res.success && res.backupCodes) {
      setTwoFactorState((prev) => ({
        ...prev,
        backupCodesCount: res.backupCodes!.length,
        backupCodes: res.backupCodes!,
      }));
      setViewCodesModalOpen(true);
      notify('8 new emergency backup codes generated!');
    } else {
      notify(res.error || 'Failed to regenerate backup codes', 'error');
    }
  };

  // Update 2FA Delivery Email
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
      setTwoFactorState((prev) => ({ ...prev, deliveryEmail: res.deliveryEmail || changeEmailInput.trim() }));
      setChangeEmailModalOpen(false);
      notify('2FA delivery email updated successfully!');
    } else {
      notify(res.error || 'Failed to update 2FA delivery email', 'error');
    }
  };

  // Copy Backup Codes
  const copyAllBackupCodes = (codes: string[]) => {
    const text = `Anime Nation India - Two-Factor Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || 'Otaku User'}\nGenerated: ${new Date().toLocaleString()}\n\nEach code can unlock your account if you lose access to your email OTP.\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodesNotice(true);
    setTimeout(() => setCopiedCodesNotice(false), 3000);
    notify('Backup codes copied to clipboard!');
  };

  // Download Backup Codes
  const downloadBackupCodesAsTxt = (codes: string[]) => {
    const text = `Anime Nation India - Two-Factor Emergency Backup Codes\nAccount: ${twoFactorState.deliveryEmail || session?.user?.email || 'Otaku User'}\nGenerated: ${new Date().toLocaleString()}\n\nEach code can unlock your account if you lose access to your email OTP.\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
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

  // =========================================================================
  // 💥 ACCOUNT DELETION HANDLERS (2-STEP EMAIL OTP FLOW)
  // =========================================================================

  // Step 1: Send Account Deletion OTP — requires account email + password
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
        notify('6-digit deletion authorization code sent to your account email!');
      } else {
        notify(res.error || 'Failed to send deletion code', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error sending deletion code. Please check your connection.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Step 2: Confirm Account Deletion with 6-digit OTP + Real-time session clear
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
        // ✅ Real-time session clear — server cookies + localStorage + auth-change event
        try { await logoutAction().catch(() => {}); } catch {}
        try { await signOut().catch(() => {}); } catch {}
        // Clear all localStorage
        ['user_token', 'user_id', 'user_name', 'user_email', 'user_role', 'user_avatar', 'ani_avatar', 'token', 'user'].forEach(k => {
          try { localStorage.removeItem(k); } catch {}
        });
        window.dispatchEvent(new Event('auth-change'));
        router.push('/');
        router.refresh();
      } else {
        notify(res.error || 'Failed to delete account', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Network error deleting account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const userObject = profileData?.user || session?.user || localUser;

  if (isSessionLoading && loading && !localUser) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-cyan-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Loading Otaku Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!userObject && !profileData?.authenticated) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black font-display uppercase tracking-tight text-white">
            Sign In Required
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Please sign in to access your customized Otaku profile, 2FA security shield, watchlist synchronizer, and anime preferences.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <span>Sign In to Anime Nation</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeAvatarObj = AVATAR_PRESETS.find((a) => a.id === selectedAvatarId) || AVATAR_PRESETS[2];

  return (
    <div className="min-h-screen bg-[#050716] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
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
          {notification.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition mb-2"
            >
              <ArrowLeft size={14} /> Back to Anime Hub
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white flex items-center gap-3">
              <span>Otaku Profile &amp; Security</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
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

        {/* User Hero Banner */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-[#0a0f26] to-zinc-950 p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Badge */}
            <div className="relative group">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl border-2 shadow-2xl transition-transform duration-300 group-hover:scale-105 overflow-hidden ${
                  isPhotoTabCustom && customPhotoUrl
                    ? 'border-cyan-400 bg-zinc-900 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : `${activeAvatarObj.bg} border-white/20`
                }`}
              >
                {isPhotoTabCustom && customPhotoUrl ? (
                  <img
                    src={customPhotoUrl}
                    alt={name || userObject?.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{activeAvatarObj.emoji}</span>
                )}
              </div>
            </div>

            {/* Profile Bio */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl font-black font-display tracking-tight text-white">
                  {name || userObject?.name || 'Otaku Sovereign'}
                </h2>
                {twoFactorState.enabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <ShieldCheck size={11} /> 2FA Secured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <ShieldAlert size={11} /> Basic Security
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                <Mail size={13} className="text-zinc-500" /> {userObject?.email || 'otaku@animenationindia.online'}
              </p>

              {/* Quick Activity Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mt-4 pt-4 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <Bookmark size={15} className="text-cyan-400" />
                  <span className="font-bold text-white">{profileData?.stats?.savedWatchlist ?? 0}</span>
                  <span className="text-zinc-400">Watchlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-pink-400" />
                  <span className="font-bold text-white">{profileData?.stats?.reviewsCount ?? 0}</span>
                  <span className="text-zinc-400">Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={15} className="text-rose-400" />
                  <span className="font-bold text-white">{profileData?.stats?.reactionsCount ?? 0}</span>
                  <span className="text-zinc-400">Reactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-400" />
                  <span className="font-bold text-white">Active</span>
                  <span className="text-zinc-400">Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={15} />
            <span>Profile &amp; Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock size={15} />
            <span>Security &amp; 2FA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connected')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'connected'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe size={15} />
            <span>Connected Providers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20'
            }`}
          >
            <Trash2 size={15} />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: PROFILE & AVATAR CUSTOMIZATION                                     */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
              <div>
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                  Personal Otaku Information
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Customize how your identity appears across anime watch parties, community comments, and rankings.
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
                    className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900/80 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-400 focus:bg-zinc-900 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Otaku Avatar Badge
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPhotoTabCustom(false)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                        !isPhotoTabCustom ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPhotoTabCustom(true)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                        isPhotoTabCustom ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
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
                              ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/40'
                              : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/20'
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
                  <div className="p-6 rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 space-y-4 max-w-lg">
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
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
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
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
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                      Password &amp; Credentials
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Update your account security key with end-to-end SHA-256 cloud encryption.
                    </p>
                  </div>
                  <KeyRound className="text-cyan-400 hidden sm:block" size={24} />
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
                        className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900/80 pl-11 pr-11 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-zinc-900 focus:ring-2 focus:ring-cyan-400/20"
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
                        className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900/80 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-zinc-900 focus:ring-2 focus:ring-cyan-400/20"
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
                        className={`h-12 w-full rounded-xl border bg-zinc-900/80 pl-11 pr-10 text-sm text-white outline-none transition ${
                          confirmNewPassword
                            ? confirmNewPassword === newPassword
                              ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                            : 'border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
                        }`}
                      />
                      {confirmNewPassword && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {confirmNewPassword === newPassword ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : (
                            <AlertCircle size={16} className="text-rose-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmNewPassword && (
                      confirmNewPassword === newPassword ? (
                        <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
                          <CheckCircle2 size={12} /> Passwords match
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> Passwords do not match
                        </p>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPass ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>

                {/* Password Reset Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Forgot or want to reset password via Email?</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        We&apos;ll dispatch a secure 6-digit OTP from <strong className="text-cyan-400 font-mono">animenationindia.support@gmail.com</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                    >
                      <Mail size={14} />
                      <span>Send Reset Code</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication (2FA) Complete Card */}
              <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 shadow-xl backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3.5 rounded-2xl border shrink-0 ${
                        twoFactorState.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-zinc-900 text-zinc-400 border-white/10'
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
                        Every sign-in attempt requires a 6-digit email OTP dispatched from{' '}
                        <strong className="text-cyan-400 font-mono">animenationindia.support@gmail.com</strong> or an emergency backup recovery code.
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

                {/* 2FA Activated Details Dashboard */}
                {twoFactorState.enabled && (
                  <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    {/* Delivery Email Box */}
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-cyan-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Delivery Email</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setChangeEmailInput(twoFactorState.deliveryEmail);
                            setChangeEmailModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Change</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono font-bold text-white truncate bg-zinc-950/80 px-3 py-2 rounded-xl border border-white/5">
                        {twoFactorState.deliveryEmail || userObject?.email || 'otaku@animenationindia.online'}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-2">
                        All 2FA login security alerts &amp; OTPs are dispatched here.
                      </p>
                    </div>

                    {/* Emergency Backup Codes Box */}
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 flex flex-col justify-between">
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
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-zinc-950 border border-white/10 text-xs font-bold text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View 8 Codes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegenerateDialog(true)}
                          disabled={is2FAActionLoading}
                          className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                          title="Regenerate all 8 codes"
                        >
                          <RefreshCw size={13} className={is2FAActionLoading ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-2">
                        Each emergency code can unlock your account if email delivery is delayed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CONNECTED PROVIDERS & DATABASE HUB                                 */}
          {/* ========================================================================= */}
          {activeTab === 'connected' && (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                  Connected Providers &amp; Integrations
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Link social providers for instant 1-click authentication across mobile, desktop, and tablets.
                </p>
              </div>

              {/* Google Provider Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
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
                    <CheckCircle2 size={12} />
                    <span>Linked &amp; Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/profile' })}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Link Google
                  </button>
                )}
              </div>

              {/* GitHub Provider Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
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
                    <CheckCircle2 size={12} />
                    <span>Linked &amp; Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/profile' })}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Link GitHub
                  </button>
                )}
              </div>

              {/* Discord Provider Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center text-[#5865F2]">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Discord Community</p>
                    <p className="text-[11px] text-zinc-400">
                      {providers.find((p) => p.id === 'discord')?.connected ? 'Connected to Discord' : 'Ready to link'}
                    </p>
                  </div>
                </div>

                {providers.find((p) => p.id === 'discord')?.connected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={12} />
                    <span>Linked &amp; Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => authClient.signIn.social({ provider: 'discord', callbackURL: '/profile' })}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Link Discord
                  </button>
                )}
              </div>

              {/* Neon Cloud Database Status */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Neon Serverless PostgreSQL</p>
                    <p className="text-[11px] text-zinc-400">AWS ap-southeast-1 pooler connected</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <CheckCircle2 size={12} />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DANGER ZONE (PERMANENT ACCOUNT DELETION VIA EMAIL OTP)             */}
          {/* ========================================================================= */}
          {activeTab === 'danger' && (
            <div className="rounded-3xl border border-rose-500/30 bg-zinc-950/80 p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-rose-400">
                    Permanent Account Deletion
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                    Once deleted, your account cannot be recovered. All saved watchlists, custom folders, 2FA credentials, reviews, and community reactions will be permanently wiped from Neon PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white">Delete your Anime Nation India account and data</p>
                  <p className="text-[11px] text-zinc-400">Requires 6-digit email OTP authorization to finalize.</p>
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
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ENABLE 2FA WIZARD (EMAIL ➔ OTP ➔ 8 BACKUP CODES)                */}
      {/* ========================================================================= */}
      {enable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (enable2FAStep !== 'codes') setEnable2FAModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
                  className="p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step 1: Confirm Delivery Email */}
            {enable2FAStep === 'request' && (
              <form onSubmit={handleStartEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  We will send 6-digit login verification codes and security alerts from <strong className="text-cyan-400 font-mono">animenationindia.support@gmail.com</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    2FA Delivery Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="email"
                      value={enable2FAEmail}
                      onChange={(e) => setEnable2FAEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">You can customize this to any trusted email address.</p>
                </div>

                <button
                  type="submit"
                  disabled={is2FAActionLoading}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span>Send 6-Digit Activation Code</span>
                </button>
              </form>
            )}

            {/* Step 2: Enter 6-Digit OTP */}
            {enable2FAStep === 'verify' && (
              <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Enter the 6-digit activation code sent to <strong className="text-cyan-400 font-mono">{enable2FAEmail}</strong>:
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                    6-Digit Activation Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enable2FACode}
                    onChange={(e) => setEnable2FACode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="h-14 w-full rounded-2xl border border-white/20 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={is2FAActionLoading || enable2FACode.length !== 6}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Verify &amp; Activate 2FA</span>
                </button>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setEnable2FAStep('request')}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={enable2FAResendCooldown > 0 || is2FAActionLoading}
                    onClick={() => handleStartEnable2FA()}
                    className="font-semibold text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {enable2FAResendCooldown > 0 ? `Resend in ${enable2FAResendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Present 8 Backup Codes */}
            {enable2FAStep === 'codes' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
                  ⚠️ <strong>Save these 8 backup recovery codes immediately.</strong> If you ever lose access to your email or OTP delivery fails, any of these codes can unlock your account. Each code can be used once.
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-zinc-900/90 border border-white/10">
                  {twoFactorState.backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-xl border border-white/5 font-mono text-sm font-bold text-white tracking-widest"
                    >
                      <span className="text-zinc-500 text-xs mr-2">{idx + 1}.</span>
                      <span className="text-emerald-400">{code}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>{copiedCodesNotice ? 'Copied!' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download .TXT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEnable2FAModalOpen(false)}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-500 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <Check size={16} />
                  <span>I have saved my backup codes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW / MANAGE 8 BACKUP CODES                                     */}
      {/* ========================================================================= */}
      {viewCodesModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewCodesModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Emergency Backup Codes
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {twoFactorState.backupCodes.length} / 8 codes active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewCodesModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Use any of these codes to sign in if you do not receive the email OTP. You can regenerate new codes anytime.
            </p>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-zinc-900/90 border border-white/10 mb-5">
              {twoFactorState.backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-xl border border-white/5 font-mono text-sm font-bold text-white tracking-widest"
                >
                  <span className="text-zinc-500 text-xs mr-2">{idx + 1}.</span>
                  <span className="text-amber-400">{code}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => copyAllBackupCodes(twoFactorState.backupCodes)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
              >
                <Copy size={14} />
                <span>{copiedCodesNotice ? 'Copied!' : 'Copy All'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBackupCodesAsTxt(twoFactorState.backupCodes)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                <span>Download .TXT</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewCodesModalOpen(false);
                setRegenerateDialog(true);
              }}
              disabled={is2FAActionLoading}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-amber-500/30 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
            >
              <RefreshCw size={14} className={is2FAActionLoading ? 'animate-spin' : ''} />
              <span>Regenerate 8 New Codes</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DISABLE 2FA CONFIRMATION (WITH OTP)                              */}
      {/* ========================================================================= */}
      {disable2FAModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDisable2FAModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-rose-500/40 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-rose-400">
                <ShieldAlert size={26} />
                <h3 className="text-xl font-black font-display uppercase tracking-tight">
                  Disable 2FA Protection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisable2FAModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                For security, enter the 6-digit confirmation code dispatched to{' '}
                <strong className="text-white font-mono">{twoFactorState.deliveryEmail}</strong>:
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={disable2FACode}
                  onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="h-12 w-full rounded-xl border border-rose-500/40 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-widest text-white outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisable2FAModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={is2FAActionLoading || disable2FACode.length !== 6}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Disable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CHANGE 2FA DELIVERY EMAIL                                        */}
      {/* ========================================================================= */}
      {changeEmailModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setChangeEmailModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="text-cyan-400" size={22} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                  Update 2FA Delivery Email
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChangeEmailModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryEmail} className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter the email address where login security verification OTP codes will be sent.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  New 2FA Email
                </label>
                <input
                  type="email"
                  value={changeEmailInput}
                  onChange={(e) => setChangeEmailInput(e.target.value)}
                  placeholder="security@example.com"
                  required
                  className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 px-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangeEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={is2FAActionLoading}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition disabled:opacity-50 cursor-pointer"
                >
                  {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: 2-STEP ACCOUNT DELETION WITH EMAIL OTP                           */}
      {/* ========================================================================= */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={28} />
                <h3 className="text-xl font-black font-display uppercase tracking-tight">
                  {deleteStep === 'confirm' ? 'Delete Account' : 'Verify Deletion Authorization'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: WARNING & CONFIRMATION TEXT */}
            {deleteStep === 'confirm' ? (
              <form onSubmit={handleStartDeleteRequest} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                  ⚠️ <strong>Irreversible Action:</strong> Deleting your account will immediately erase all your anime watchlists, ratings, reviews, and security credentials from PostgreSQL.
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Account Login Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="email"
                      value={deleteTargetEmail}
                      onChange={(e) => setDeleteTargetEmail(e.target.value)}
                      placeholder="your-login@email.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-rose-400"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Must be your exact account login email. No alternate emails accepted.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 w-full rounded-xl border border-white/15 bg-zinc-900 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-rose-400"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Your account password is required to authorize deletion.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Type <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    required
                    className="h-12 w-full rounded-xl border border-rose-500/40 bg-zinc-900 px-4 text-sm text-white font-mono placeholder-zinc-600 outline-none focus:border-rose-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting || !deleteTargetEmail || !deletePassword}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-lg shadow-rose-900/30 disabled:opacity-40 cursor-pointer"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    <span>Verify & Send Deletion Code</span>
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: 6-DIGIT DELETION OTP CONFIRMATION */
              <form onSubmit={handleFinalizeDeleteAccount} className="space-y-4 animate-in fade-in">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A 6-digit deletion authorization code has been dispatched from <strong className="text-cyan-400 font-mono">animenationindia.support@gmail.com</strong> to your account email <strong className="text-white font-mono">{deleteTargetEmail}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                    6-Digit Deletion Authorization Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="h-14 w-full rounded-2xl border border-rose-500/50 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-rose-400 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeleteStep('confirm')}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Go back
                  </button>

                  <button
                    type="button"
                    disabled={deleteResendCooldown > 0 || isDeleting}
                    onClick={() => handleStartDeleteRequest({ preventDefault: () => {} } as any)}
                    className="font-semibold text-rose-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {deleteResendCooldown > 0 ? `Resend in ${deleteResendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deleteOtp.length !== 6}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-lg shadow-rose-900/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span>Permanently Terminate Account</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Dialog */}
      {regenerateDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setRegenerateDialog(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-950 p-6 shadow-2xl shadow-black/90 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <RefreshCw size={24} />
              <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                Regenerate Backup Codes
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to generate 8 new emergency backup codes? Any previous recovery codes will be immediately invalidated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegenerateDialog(false)}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performRegenerateCodes}
                disabled={is2FAActionLoading}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {is2FAActionLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                <span>Generate New Codes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PASSWORD RESET VIA EMAIL (CUSTOM EMAIL INPUT)                    */}
      {/* ========================================================================= */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setResetModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-cyan-500/30 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <KeyRound size={22} />
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {!resetSent ? (
              /* STEP 1: Enter email to receive OTP */
              <form onSubmit={handleSendResetOtpFromModal} className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter the email where you want to receive the 6-digit reset code. You can use your login email or any email you prefer.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="email"
                      required
                      value={resetModalEmail}
                      onChange={(e) => setResetModalEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-11 w-full rounded-xl border border-white/15 bg-zinc-900 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    The new password will update your login account regardless of which email you send the OTP to.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset || !resetModalEmail.trim()}
                    className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingReset ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    <span>Send Reset Code</span>
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Enter OTP + new password */
              <form onSubmit={handleResetWithCode} className="space-y-4 animate-in fade-in">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A 6-digit code was sent to <strong className="text-cyan-400 font-mono">{resetModalEmail}</strong>. Enter it below along with your new password.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-center">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="h-12 w-full rounded-xl border border-cyan-500/40 bg-zinc-900 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-11 w-full rounded-xl border border-white/15 bg-zinc-900 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetSent(false)}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Change email
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setResetModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting || resetCode.length !== 6 || !resetNewPass}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isResetting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>Confirm & Save</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
