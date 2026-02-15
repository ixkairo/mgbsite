import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, User, Users, ArrowLeft, Loader2, Search, Copy, Download, Check } from 'lucide-react';
import { User as UserType } from '../../types';
import { fetchLeaderboardData, findUserByIdentifier } from '../../services/dataService';
import { computeMagicianScores, getBestRole } from '../../utils/magicianScore';
import { getRarityConfig, getRoleColor } from '../../utils/rarity';
import { saveValentine, fetchValentinesBySender, ValentineData } from '../../services/valentineService';
import ValentineCard from './ValentineCard';
import { getValentineLayout } from './layoutConfig';
import { normalizeTwitterCdnUrl } from '../player/UnifiedPlayerCard';

import { Palette, LogOut } from 'lucide-react';
import { ColorPicker } from '../ui/color-picker';
import { supabase } from '../../services/supabaseClient';

type ExportTheme = 'pink' | 'purple' | 'red' | 'image' | 'custom';

const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function convertImagesToDataURLs(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const conversionPromises = imgs.map(async (img) => {
    if (img.src.startsWith('data:')) return;
    try {
      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error(`Failed to load: ${img.src}`));
        const normalizedSrc = normalizeTwitterCdnUrl(img.src);
        tempImg.src = normalizedSrc || img.src;
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });
      const canvas = document.createElement('canvas');
      canvas.width = tempImg.naturalWidth || tempImg.width;
      canvas.height = tempImg.naturalHeight || tempImg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(tempImg, 0, 0);
      img.src = canvas.toDataURL('image/png');
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    } catch (err) {
      console.warn('Failed to convert image to data URL:', img.src, err);
      if (!img.src.includes('ui-avatars.com') && !img.classList.contains('rounded-full')) {
        img.src = TRANSPARENT_PIXEL;
      }
    }
  });
  await Promise.all(conversionPromises);
}

async function ensureImagesReady(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const loaders = imgs.map((img) => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalWidth > 0) {
        resolve();
        return;
      }
      const onDone = () => {
        img.removeEventListener("load", onDone);
        img.removeEventListener("error", onDone);
        resolve();
      };
      img.addEventListener("load", onDone);
      img.addEventListener("error", onDone);
    });
  });
  await Promise.all(loaders);
  await new Promise(resolve => setTimeout(resolve, 300));
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 1.0);
  });
};

const saveImageBlob = async (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const copyImageBlobWithFallback = async (blob: Blob, fallbackFilename: string, onSuccess?: () => void) => {
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.write === 'function' && typeof (window as any).ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
      if (onSuccess) onSuccess();
      return;
    } catch (err) {
      console.warn('Clipboard copy failed, using save fallback', err);
    }
  }
  await saveImageBlob(blob, fallbackFilename);
};

interface CreateValentineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (valentine: ValentineData, isEdit: boolean) => void;
}

// Helper to adjust hex color brightness
function adjustColorBrightness(hex: string, percent: number) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.floor(Math.min(255, Math.max(0, r * (1 + percent / 100))));
  g = Math.floor(Math.min(255, Math.max(0, g * (1 + percent / 100))));
  b = Math.floor(Math.min(255, Math.max(0, b * (1 + percent / 100))));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const CreateValentineModal: React.FC<CreateValentineModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [step, setStep] = useState<'identify' | 'select' | 'recipient' | 'write'>('identify');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState<UserType | null>(null);
  const [recipientType, setRecipientType] = useState<'community' | 'user'>('user');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipient, setRecipient] = useState<UserType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userValentines, setUserValentines] = useState<ValentineData[]>([]);
  const [selectedValentineId, setSelectedValentineId] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [exportTheme, setExportTheme] = useState<ExportTheme>('image');
  const [customColor, setCustomColor] = useState('#ec4899'); // Default pink
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null); // Dedicated ref for export rendering

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 220;
  const remainingChars = MAX_CHARS - message.length;

  const layout = useMemo(() => getValentineLayout(), []);

  // Memoize the preview data to share between visible preview and hidden export render
  const previewValentine = useMemo<ValentineData>(() => ({
    id: 'preview',
    sender_username: sender?.username || '',
    sender_avatar_url: sender?.avatar_url || '',
    sender_display_name: sender?.display_name || '',
    sender_discord_username: sender?.discord_username || undefined,
    sender_role: sender ? getBestRole(sender) : undefined,
    sender_roles_raw: sender?.discrod_roles,
    sender_score: (sender as any)?.magicianScore ?? 0,
    rarity_tier: sender ? getRarityConfig((sender as any).magicianScore ?? 0, sender.discrod_roles ? sender.discrod_roles.split(/[,\-|]/).map(r => r.trim()) : [], sender.username).tier : 'common',
    recipient_type: recipientType,
    recipient_username: recipientType === 'user' ? recipient?.username : undefined,
    recipient_display_name: recipientType === 'user' ? recipient?.display_name : undefined,
    recipient_avatar_url: recipientType === 'user' ? recipient?.avatar_url : undefined,
    recipient_role: (recipientType === 'user' && recipient) ? getBestRole(recipient) : undefined,
    recipient_roles_raw: (recipientType === 'user' && recipient) ? recipient.discrod_roles : undefined,
    message_text: message,
    created_at: new Date().toISOString(),
    views: 0,
    likes: 0,
    is_anonymous: false
  }), [sender, recipientType, recipient, message]);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleAuthSession(session.user);
      }
    };

    if (isOpen) {
      checkSession();
    }

    // Listen for auth changes — only react to SIGNED_IN, not TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setSender(null);
        setStep('identify');
      }
    });

    return () => subscription.unsubscribe();
  }, [isOpen]);

  const handleAuthSession = async (user: any) => {
    // Discord handles usually in user_metadata, Twitter handles in various fields depending on provider
    const isTwitter = user.app_metadata?.provider === 'twitter' || user.app_metadata?.provider === 'x';

    // Debug: log all metadata so we can see exactly what Discord returns
    console.log('[Auth] Provider:', user.app_metadata?.provider);
    console.log('[Auth] user_metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('[Auth] identities:', JSON.stringify(user.identities?.map((i: any) => ({ provider: i.provider, identity_data: i.identity_data })), null, 2));

    let handle = '';
    if (isTwitter) {
      handle = user.user_metadata?.user_name || user.user_metadata?.screen_name || user.user_metadata?.preferred_username;
    } else {
      // Discord: preferred_username = actual Discord username,
      // name/full_name = global display name (often different!)
      // Also check identities array for the raw Discord data
      const discordIdentity = user.identities?.find((i: any) => i.provider === 'discord');
      const rawDiscord =
        user.user_metadata?.preferred_username ||
        discordIdentity?.identity_data?.preferred_username ||
        discordIdentity?.identity_data?.custom_claims?.global_name ||
        user.user_metadata?.custom_claims?.global_name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.user_name;
      handle = rawDiscord ? rawDiscord.split('#')[0] : '';
      console.log('[Auth] Extracted Discord handle:', handle);
    }

    if (handle) {
      const normalizedHandle = handle.toLowerCase();
      setIsSearching(true);
      try {
        // Find user: match discord_username for Discord, username for Twitter
        let matchedUser = await searchUser(normalizedHandle);

        // If not found with primary handle, try other metadata fields as fallback
        if (!matchedUser && !isTwitter) {
          const fallbackNames = [
            user.user_metadata?.preferred_username,
            user.user_metadata?.name,
            user.user_metadata?.full_name,
            user.user_metadata?.user_name,
            user.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.preferred_username,
            user.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.custom_claims?.global_name,
          ].filter(Boolean).map((n: string) => n.split('#')[0].toLowerCase());

          // Try each unique name that wasn't already tried
          const uniqueNames = [...new Set(fallbackNames)].filter(n => n !== normalizedHandle);
          for (const name of uniqueNames) {
            console.log('[Auth] Trying fallback name:', name);
            matchedUser = await searchUser(name);
            if (matchedUser) break;
          }
        }

        if (matchedUser) {
          setSender(matchedUser);
          // Persist username so the wall can highlight this user's cards
          try { localStorage.setItem('valentine_sender_username', matchedUser.username); } catch {}
          const valentines = await fetchValentinesBySender(matchedUser.username);
          setUserValentines(valentines);
          setStep(valentines.length > 0 ? 'select' : 'recipient');
          setSearchError('');
        } else {
          setSearchError("NOT FOUND. YOU ARE NOT A PART OF MAGICBLOCK COMMUNITY.");
        }
      } catch (err) {
        setSearchError('Profile verification failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchError(`Could not retrieve your ${isTwitter ? 'Twitter' : 'Discord'} username.`);
    }
  };

  const handleDiscordLogin = async () => {
    setSearchError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin + '/valentinewall?openModal=true',
        scopes: 'identify'
      }
    });
    if (error) setSearchError(error.message);
  };

  const handleTwitterLogin = async () => {
    setSearchError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: window.location.origin + '/valentinewall?openModal=true'
      }
    });
    if (error) setSearchError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSender(null);
    setStep('identify');
  };

  const searchUser = async (input: string): Promise<UserType | null> => {
    const rawUsers = await fetchLeaderboardData();
    const usersWithScores = computeMagicianScores(rawUsers);
    const normalized = input.trim().toLowerCase().replace(/^@/, '');

    console.log('[Auth] Searching for:', normalized, 'among', usersWithScores.length, 'users');

    let user = usersWithScores.find(u =>
      u.username.toLowerCase() === normalized ||
      (u.discord_username && (
        u.discord_username.toLowerCase() === normalized ||
        u.discord_username.toLowerCase().split('#')[0] === normalized
      )) ||
      u.display_name.toLowerCase().includes(normalized)
    );

    if (!user) {
      console.log('[Auth] Not found in memory, trying DB fallback...');
      const directUser = await findUserByIdentifier(normalized);
      if (directUser) user = directUser as any;
    }

    console.log('[Auth] Search result:', user ? `Found: ${user.username} (discord: ${user.discord_username})` : 'NOT FOUND');
    return user || null;
  };

  const handleIdentify = async () => {
    if (!username.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const user = await searchUser(username);

      if (!user) {
        setSearchError("NOT FOUND. YOU ARE NOT A PART OF MAGICBLOCK COMMUNITY.");
        setIsSearching(false);
        return;
      }

      setSender(user);

      const valentines = await fetchValentinesBySender(user.username);
      setUserValentines(valentines);

      if (valentines.length > 0) {
        setStep('select');
      } else {
        setStep('recipient');
      }

      setIsSearching(false);
    } catch (err) {
      console.error(err);
      setSearchError('Something went wrong. Please try again.');
      setIsSearching(false);
    }
  };

  const handleSelectValentine = async (val?: ValentineData) => {
    if (val) {
      // Edit existing
      setIsEdit(true);
      setSelectedValentineId(val.id || null);
      setMessage(val.message_text);
      setRecipientType(val.recipient_type);
      if (val.recipient_username) {
        setRecipientUsername(val.recipient_username);
        const recipientUser = await searchUser(val.recipient_username);
        setRecipient(recipientUser);
      }
      setStep('write');
    } else {
      // Create new (only works if count < 5)
      if (userValentines.length >= 5) return;
      setIsEdit(false);
      setSelectedValentineId(null);
      setMessage('');
      setRecipientType('user');
      setRecipientUsername('');
      setRecipient(null);
      setStep('recipient');
    }
  };

  const handleRecipientContinue = async () => {
    if (recipientType === 'user' && recipientUsername.trim()) {
      const recipientUser = await searchUser(recipientUsername);
      if (!recipientUser) {
        setSearchError('Recipient not found.');
        return;
      }
      setRecipient(recipientUser);
    }
    setSearchError('');
    setStep('write');
  };

  const handleSend = async () => {
    if (!sender || !message.trim()) return;

    // Check for active Supabase auth session — required by RLS policy
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSearchError('You must connect via Discord or Twitter to send valentines. Please go back and log in.');
      setStep('identify');
      return;
    }

    try {
      const senderRoles = sender.discrod_roles ? sender.discrod_roles.split(/[,\-|]/).map(r => r.trim()) : [];
      const senderScore = (sender as any).magicianScore ?? 0;
      const senderRarity = getRarityConfig(senderScore, senderRoles, sender.username);

      const valentine: ValentineData = {
        id: selectedValentineId || undefined,
        sender_username: sender.username,
        sender_avatar_url: sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username)}&background=8B5CF6&color=fff`,
        sender_display_name: sender.display_name || sender.username,
        sender_discord_username: sender.discord_username || undefined,
        sender_role: getBestRole(sender),
        sender_roles_raw: sender.discrod_roles,
        sender_score: senderScore,
        rarity_tier: senderRarity.tier,
        recipient_type: recipientType,
        recipient_username: recipientType === 'user' ? recipient?.username : undefined,
        recipient_display_name: recipientType === 'user' ? (recipient?.display_name || recipient?.username) : undefined,
        recipient_avatar_url: recipientType === 'user' ? (recipient?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.username || '')}&background=8B5CF6&color=fff`) : undefined,
        recipient_role: (recipientType === 'user' && recipient) ? getBestRole(recipient) : undefined,
        recipient_roles_raw: (recipientType === 'user' && recipient) ? recipient.discrod_roles : undefined,
        message_text: message.trim()
      };

      const success = await saveValentine(valentine);

      if (success) {
        onSubmit(valentine, isEdit);
        handleClose();
      } else {
        alert('Failed to send valentine. This may be a permissions issue — try logging in via Discord or Twitter first.');
      }
    } catch (error) {
      console.error('Error sending valentine:', error);
      alert('Error sending valentine: ' + (error as Error).message);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('identify');
      setUsername('');
      setMessage('');
      setSender(null);
      setRecipient(null);
      setRecipientUsername('');
      setRecipientType('user');
      setUserValentines([]);
      setSelectedValentineId(null);
      setIsEdit(false);
      setSearchError('');
    }, 300);
  };

  const handleBack = () => {
    if (step === 'write') setStep(userValentines.length > 0 ? 'select' : 'recipient');
    else if (step === 'recipient') setStep(userValentines.length > 0 ? 'select' : 'identify');
    else if (step === 'select') setStep('identify');
  };

  const handleExport = async (mode: 'download' | 'copy') => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      const element = exportRef.current;

      await convertImagesToDataURLs(element);
      await ensureImagesReady(element);

      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: 'transparent',
        style: { transform: 'none' }
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Fixed 2000x2000 Resolution
      const canvasW = 2000;
      const canvasH = 2000;
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get context');

      // Theme Colors
      let bgFrom, bgTo, glowColor, glowStop, bgImage: HTMLImageElement | null = null;

      if (exportTheme === 'image') {
        bgImage = new Image();
        bgImage.src = '/heartbg1.jpg';
        await new Promise((resolve, reject) => {
          if (!bgImage) return resolve(null);
          bgImage.onload = resolve;
          bgImage.onerror = () => {
            console.warn("Failed to load background image, falling back to purple");
            bgImage = null;
            resolve(null);
          };
        });
      }

      if (exportTheme === 'pink') {
        bgFrom = '#3a2028';
        bgTo = '#0d0b0c';
        glowColor = 'rgba(236, 72, 153, 0.45)';
        glowStop = 'rgba(236, 72, 153, 0.1)';
      } else if (exportTheme === 'red') {
        bgFrom = '#3d1a1a';
        bgTo = '#0d0a0a';
        glowColor = 'rgba(239, 68, 68, 0.45)';
        glowStop = 'rgba(239, 68, 68, 0.1)';
      } else if (exportTheme === 'image') {
        bgFrom = '#151518';
        bgTo = '#050505';
        glowColor = 'rgba(255, 255, 255, 0.5)'; // Vibrant white glow
        glowStop = 'rgba(255, 255, 255, 0.15)';
      } else if (exportTheme === 'custom') {
        glowColor = customColor + '77'; // 45% opacity
        glowStop = customColor + '1a';  // 10% opacity
        bgFrom = adjustColorBrightness(customColor, -75); // Vibrant deep version matches preview
        bgTo = adjustColorBrightness(customColor, -88);
      } else {
        bgFrom = '#251e3d';
        bgTo = '#08080d';
        glowColor = 'rgba(139, 92, 246, 0.45)';
        glowStop = 'rgba(139, 92, 246, 0.1)';
      }

      // Draw Background
      if (bgImage) {
        // Draw image background (cover)
        const imgRatio = bgImage.width / bgImage.height;
        const canvasRatio = canvasW / canvasH;
        let drawW, drawH, drawX, drawY;

        if (imgRatio > canvasRatio) {
          drawH = canvasH;
          drawW = canvasH * imgRatio;
          drawX = (canvasW - drawW) / 2;
          drawY = 0;
        } else {
          drawW = canvasW;
          drawH = canvasW / imgRatio;
          drawX = 0;
          drawY = (canvasH - drawH) / 2;
        }
        ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

        // Removed darken effect to let the background shine
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasH);
        gradient.addColorStop(0, bgFrom || '#101012');
        gradient.addColorStop(1, bgTo || '#050505');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Subtly darken gradient
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvasW, canvasH);
      }

      // Glow Drawing - Consistently Shaped for All Themes
      const heartImg = new Image();
      heartImg.src = '/heart1.png';
      await new Promise((resolve) => {
        heartImg.onload = resolve;
        heartImg.onerror = resolve;
      });

      if (heartImg.complete && heartImg.naturalWidth > 0) {
        // --- NEW: Top-Down Spotlight (Image Theme Only) ---
        if (exportTheme === 'image') {
          ctx.save();
          // Large, soft radial at top center
          const spotlight = ctx.createRadialGradient(canvasW / 2, 0, 0, canvasW / 2, 0, canvasW * 0.9);
          spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.28)'); // Subtle white glow
          spotlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
          spotlight.addColorStop(1, 'transparent');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = spotlight;
          ctx.fillRect(0, 0, canvasW, canvasH);
          ctx.restore();
        }

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 120;

        const heartScale = 0.82; // Optimized for 2000x2000 canvas to prevent glow clipping
        const hW = canvasW * heartScale;
        const hH = canvasH * heartScale;
        const hX = (canvasW - hW) / 2;
        const hY = (canvasH - hH) / 2;

        // Draw multiple times for higher intensity
        ctx.globalAlpha = 0.05; // Keep low to show underlying background
        ctx.drawImage(heartImg, hX, hY, hW, hH);
        ctx.shadowBlur = 80;
        ctx.shadowColor = exportTheme === 'custom' ? customColor + '99' : glowStop;
        ctx.drawImage(heartImg, hX, hY, hW, hH);
        ctx.restore();
      }

      // --- ADJUST SIZE HERE ---
      // We want the heart to be as large as possible without clipping the glow.
      // The container has 40px padding (x2 = 80px). Total width = 650 + 80 = 730px.
      // We scale this 730px container to fit the 2000px canvas.
      const targetWidth = 1980; // Total width on the canvas (including its own padding)
      const cardScale = targetWidth / img.width;
      const drawW = img.width * cardScale;
      const drawH = img.height * cardScale;

      const x = (canvasW - drawW) / 2;
      const y = (canvasH - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);

      // --- Watermark Removed ---


      const blob = await canvasToBlob(canvas);
      const filename = `valentine-${sender?.username}-${recipientType === 'user' ? recipient?.username : 'community'}.png`;

      if (mode === 'download') {
        await saveImageBlob(blob, filename);
      } else {
        await copyImageBlobWithFallback(blob, filename, () => {
          setShowCopiedToast(true);
          setTimeout(() => setShowCopiedToast(false), 2000);
        });
      }

    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <AnimatePresence mode="wait">
        {step === 'identify' && (
          <motion.div
            key="identify"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

              <div className="relative z-10 p-8 md:p-10 flex flex-col items-center">
                <button
                  onClick={handleClose}
                  className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 hover:text-white transition-all text-white/40 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <X className="w-4 h-4 relative z-10" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6] animate-pulse" />
                  <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-mb-purple font-bold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">verification</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-sync font-bold tracking-tighter uppercase text-white leading-none mb-4 drop-shadow-lg text-center">
                  Verify Identity
                </h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-8 text-center max-w-[240px]">
                  Sign in with Discord to access your MagicBlock profile
                </p>

                <div className="w-full space-y-3 mb-6">
                  <motion.button
                    onClick={handleDiscordLogin}
                    disabled={isSearching}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: "rgba(88, 101, 242, 0.15)",
                      boxShadow: "0 0 40px rgba(88, 101, 242, 0.25)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 rounded-3xl bg-white/[0.04] border border-[#5865F2]/40 text-white flex items-center justify-center gap-4 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5865F2]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#5865F2]" />
                    ) : (
                      <svg
                        viewBox="0 0 127.14 96.36"
                        className="w-6 h-6 fill-[#5865F2] group-hover:fill-white transition-colors duration-300"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.72,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.22,85.78a68.21,68.21,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.51,10.58,105.26,105.26,0,0,0,32.19-16.14h0C129.58,52.41,121.08,28.6,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.7,11.43-12.7S54,46,53.87,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.7,11.44-12.7S96.23,46,96.11,53,91,65.69,84.69,65.69Z" />
                      </svg>
                    )}
                    <span className="text-xs font-bold uppercase tracking-[0.3em] relative z-10 group-hover:text-white transition-colors">
                      {isSearching ? 'Verifying...' : 'Connect Discord'}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={handleTwitterLogin}
                    disabled={isSearching}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-white/50 flex items-center justify-center gap-3 transition-all duration-500 group backdrop-blur-md"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/20 group-hover:fill-white transition-colors duration-300" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                      Try Twitter
                    </span>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {searchError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden w-full"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-xl">
                        <p className="text-center text-[11px] text-white/60 font-mono uppercase tracking-[0.15em] leading-relaxed">
                          <span className="text-white block mb-1 font-bold">Not Found</span>
                          <span className="opacity-70">You are not a part of MagicBlock community yet.</span>
                          {searchError.includes('Discord') && !searchError.includes('Twitter') && (
                            <span className="block mt-3 text-mb-purple/60 text-[9px] lowercase tracking-widest border-t border-white/5 pt-3">Try connecting with Twitter instead</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}

        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full h-full flex flex-col items-center justify-center gap-8 max-w-2xl"
          >
            <div className="text-center mb-4">
              <Heart className="w-10 h-10 text-mb-purple mb-6 mx-auto" />
              <h2 className="text-4xl font-sync font-bold uppercase text-white tracking-tighter mb-4">Your Valentines</h2>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">You can send up to 5 Valentines</p>
            </div>

            <div className="w-full flex flex-col gap-4">
              {userValentines.map((v, idx) => (
                <button
                  key={v.id || idx}
                  onClick={() => handleSelectValentine(v)}
                  className="group relative w-full p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-mb-purple/50 transition-all duration-300 flex items-center gap-6 text-left"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                    <img src={v.recipient_avatar_url || '/comm.png'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-mb-purple mb-1">To</div>
                    <div className="text-lg font-bold text-white truncate">{v.recipient_display_name || (v.recipient_type === 'community' ? 'Community' : 'Unknown')}</div>
                    <p className="text-[10px] text-white/40 truncate mt-1 italic">"{v.message_text}"</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check className="w-4 h-4 text-mb-purple" />
                  </div>
                </button>
              ))}

              {userValentines.length < 5 && (
                <button
                  onClick={() => handleSelectValentine()}
                  className="w-full p-6 rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-mb-purple/40 hover:bg-mb-purple/5 transition-all duration-300 flex items-center justify-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-mb-purple/20 transition-colors">
                    <Send className="w-4 h-4 text-white/40 group-hover:text-mb-purple" />
                  </div>
                  <span className="text-sm font-bold text-white/40 group-hover:text-white uppercase tracking-widest font-mono">Create New Valentine</span>
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 mt-4">
              {sender && (
                <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-full px-4 py-2 mb-2">
                  <img src={sender.avatar_url} className="w-5 h-5 rounded-full border border-white/20" alt="" />
                  <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{sender.display_name}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign out to switch account
              </button>
            </div>
          </motion.div>
        )}

        {step === 'recipient' && sender && (
          <motion.div
            key="recipient"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-black/30 backdrop-blur-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

              <div className="relative z-10 p-8">
                <button
                  onClick={handleClose}
                  className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 hover:text-white transition-all text-white/40"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                  <div className="relative">
                    <img
                      src={sender.avatar_url}
                      alt={sender.display_name}
                      className="w-12 h-12 rounded-full border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-mb-purple text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-black">
                      YOU
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm tracking-tight">{sender.display_name}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">@{sender.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
                  <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-mb-purple font-bold">recipient</span>
                </div>
                <h3 className="text-xl font-sync font-bold tracking-tighter uppercase text-white leading-none mb-6">
                  Select Target
                </h3>

                <div className="space-y-3 mb-6">
                  {/* Specific User option */}
                  <div
                    onClick={() => setRecipientType('user')}
                    className={`relative w-full rounded-[2rem] border transition-all duration-300 overflow-hidden cursor-pointer ${recipientType === 'user'
                      ? 'bg-white/[0.1] border-mb-purple/50 shadow-[0_0_25px_rgba(139,92,246,0.2)]'
                      : 'bg-white/[0.03] border-mb-purple/20 hover:bg-white/[0.06] hover:border-mb-purple/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      }`}
                  >
                    {recipientType === 'user' && <div className="absolute inset-0 bg-mb-purple/10 pointer-events-none" />}
                    <div className="flex items-center justify-between gap-3 px-6 py-5 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${recipientType === 'user' ? 'bg-mb-purple text-white shadow-lg' : 'bg-mb-purple/20 text-mb-purple'}`}>
                          <User className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <span className={`font-bold text-lg block ${recipientType === 'user' ? 'text-white' : 'text-white/80'}`}>Specific User</span>
                          <span className="text-[10px] font-mono text-white/40 tracking-wider uppercase">Send to a friend</span>
                        </div>
                      </div>
                      {recipientType === 'user' && <div className="w-2.5 h-2.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />}
                    </div>

                    {/* Search input embedded inside this card */}
                    <AnimatePresence>
                      {recipientType === 'user' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 relative z-10" onClick={(e) => e.stopPropagation()}>
                            <div className="relative group/rinput">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-mb-purple/50 to-pink-500/50 rounded-full opacity-0 group-focus-within/rinput:opacity-100 transition-opacity duration-500 blur-sm" />
                              <div className="relative flex items-center bg-black/50 border border-white/20 rounded-full overflow-hidden">
                                <div className="pl-5 text-white/40">
                                  <Search size={14} />
                                </div>
                                <input
                                  ref={recipientInputRef}
                                  type="text"
                                  value={recipientUsername}
                                  onChange={(e) => {
                                    setRecipientUsername(e.target.value);
                                    setSearchError('');
                                  }}
                                  placeholder="SEARCH RECIPIENT..."
                                  className="w-full px-4 py-3 bg-transparent text-white text-[10px] font-mono tracking-[0.2em] uppercase placeholder:text-white/20 focus:outline-none"
                                />
                              </div>
                              {searchError && (
                                <p className="mt-2 text-[9px] text-red-400 font-mono uppercase tracking-wider text-center">{searchError}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Community option */}
                  <button
                    onClick={() => setRecipientType('community')}
                    className={`relative w-full flex items-center justify-between gap-3 px-6 py-4 rounded-[2rem] border transition-all duration-300 group overflow-hidden ${recipientType === 'community'
                      ? 'bg-white/[0.08] border-white/20 shadow-lg'
                      : 'bg-transparent border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                      }`}
                  >
                    {recipientType === 'community' && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-2 rounded-lg transition-colors ${recipientType === 'community' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20'}`}>
                        <img src="/comm.png" className="w-4 h-4 object-contain opacity-80" />
                      </div>
                      <div className="text-left">
                        <span className={`font-bold text-sm block ${recipientType === 'community' ? 'text-white' : 'text-white/40'}`}>The Community</span>
                        <span className="text-[9px] font-mono text-white/20 tracking-wider uppercase">Public Board</span>
                      </div>
                    </div>
                    {recipientType === 'community' && <div className="w-2 h-2 rounded-full bg-white/50" />}
                  </button>
                </div>

                <div className="flex gap-3 mt-8">
                  <motion.button
                    onClick={() => setStep('identify')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:bg-white/[0.1] hover:text-white transition-all backdrop-blur-md"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleRecipientContinue}
                    disabled={recipientType === 'user' && !recipientUsername.trim()}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-[2] py-3 rounded-full bg-white/[0.08] border border-mb-purple/60 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-white/[0.15] hover:border-mb-purple hover:text-white backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'write' && sender && (
          <motion.div
            key="write"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-[1400px] px-4"
          >
            <div className="relative flex flex-col lg:flex-row px-4 pb-8 pt-12 lg:p-8 gap-8 lg:gap-16 items-stretch justify-center min-h-screen lg:min-h-0">
              {/* Floating Close Button */}
              <button
                onClick={handleClose}
                className="fixed top-8 right-8 p-3.5 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.15] hover:border-white/30 hover:text-white transition-all text-white/50 z-[100] backdrop-blur-2xl shadow-2xl active:scale-95 group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <div className="lg:hidden flex w-full bg-white/[0.05] rounded-full p-1 mb-4 border border-white/10 shrink-0">
                <button
                  onClick={() => setMobileTab('edit')}
                  className={`flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileTab === 'edit' ? 'bg-mb-purple text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                >
                  Write Note
                </button>
                <button
                  onClick={() => setMobileTab('preview')}
                  className={`flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileTab === 'preview' ? 'bg-mb-purple text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                >
                  Preview Card
                </button>
              </div>

              {/* LEFT PANEL: PREVIEW MODULE */}
              <div className={`w-full lg:w-[58%] flex flex-col items-center gap-6 ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
                {/* Live Preview Header */}
                <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/60">Live Preview</span>
                </div>

                {/* PERFECT SQUARE PREVIEW BOX */}
                <div className="relative w-full aspect-square max-w-[min(100%,700px,65vh)] flex items-center justify-center p-2 rounded-[4rem] bg-white/[0.02] border border-white/5 shadow-inner overflow-visible">
                  <div
                    ref={previewRef}
                    className="relative w-full h-full transition-all duration-500 overflow-hidden rounded-[3.5rem] shadow-2xl"
                    style={{
                      background: exportTheme === 'pink' ? 'linear-gradient(to bottom, #3a2028, #0d0b0c)' :
                        exportTheme === 'red' ? 'linear-gradient(to bottom, #3d1a1a, #0d0a0a)' :
                          exportTheme === 'purple' ? 'linear-gradient(to bottom, #251e3d, #08080d)' :
                            exportTheme === 'custom' ? `linear-gradient(to bottom, ${adjustColorBrightness(customColor, -75)}, ${adjustColorBrightness(customColor, -88)})` :
                              'none'
                    }}
                  >
                    {/* Darken overlay for default themes */}
                    {(exportTheme !== 'image') && (
                      <div className="absolute inset-0 bg-black/15 rounded-[3.5rem] pointer-events-none z-[1]" />
                    )}

                    {exportTheme === 'image' && (
                      <img
                        src="/heartbg1.jpg"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 rounded-[3.5rem]"
                      />
                    )}

                    {/* Theme Glow Shadow Layers */}
                    <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-500 flex items-center justify-center">
                      {exportTheme === 'image' && (
                        <div
                          className="absolute inset-0 z-0 pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)'
                          }}
                        />
                      )}

                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-[82%] h-[82%] flex items-center justify-center">
                          <img
                            src="/heart1.png"
                            className="w-full h-full opacity-[0.05]"
                            style={{
                              filter: `drop-shadow(0 0 120px ${exportTheme === 'pink' ? 'rgba(236, 72, 153, 0.45)' :
                                exportTheme === 'red' ? 'rgba(239, 68, 68, 0.45)' :
                                  exportTheme === 'purple' ? 'rgba(139, 92, 246, 0.45)' :
                                    exportTheme === 'image' ? 'rgba(255, 255, 255, 0.5)' :
                                      `${customColor}77`
                                })`
                            }}
                          />
                          <img
                            src="/heart1.png"
                            className="absolute inset-0 w-full h-full opacity-[0.05]"
                            style={{
                              filter: `drop-shadow(0 0 80px ${exportTheme === 'pink' ? 'rgba(236, 72, 153, 0.3)' :
                                exportTheme === 'red' ? 'rgba(239, 68, 68, 0.3)' :
                                  exportTheme === 'purple' ? 'rgba(139, 92, 246, 0.3)' :
                                    exportTheme === 'image' ? 'rgba(255, 255, 255, 0.15)' :
                                      `${customColor}55`
                                })`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="relative z-10 w-full h-full p-2 flex items-center justify-center overflow-visible">
                      <ValentineCard
                        valentine={previewValentine}
                        showShadow={false}
                      />
                    </div>
                  </div>
                </div>

                {/* THEME SELECTION PANEL (Moved Below Preview) */}
                <div className="flex flex-col items-center gap-5 w-full max-w-[650px] relative z-20">
                  <div className="flex flex-wrap justify-center items-center gap-4 px-6 py-4 rounded-[2.5rem] bg-white/[0.04] border border-white/5 backdrop-blur-xl shadow-inner">
                    {/* Image Theme */}
                    <button
                      onClick={() => setExportTheme('image')}
                      className={`w-7 h-7 rounded-full border border-white/20 overflow-hidden relative transition-all duration-300 ${exportTheme === 'image' ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                    >
                      <img src="/heartbg1.jpg" className="absolute inset-0 w-full h-full object-cover" />
                    </button>

                    {/* Presets */}
                    {[
                      { id: 'pink', color: '#EC4899', glow: '#EC4899' },
                      { id: 'purple', color: '#8B5CF6', glow: '#8B5CF6' },
                      { id: 'red', color: '#EF4444', glow: '#EF4444' }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setExportTheme(preset.id as any)}
                        className={`w-7 h-7 rounded-full transition-all duration-300 relative group/p ${exportTheme === preset.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg'
                          : 'opacity-40 hover:opacity-100 hover:scale-110'
                          }`}
                        style={{
                          backgroundColor: preset.color,
                          boxShadow: exportTheme === preset.id ? `0 0 20px ${preset.glow}66` : 'none'
                        }}
                      >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover/p:opacity-100 transition-opacity" />
                      </button>
                    ))}

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Custom Picker */}
                    <ColorPicker
                      color={customColor}
                      useHex={true}
                      onChange={(newColor) => {
                        setCustomColor(newColor);
                        setExportTheme('custom');
                      }}
                    >
                      <button
                        className={`w-9 h-9 rounded-full border border-white/20 transition-all duration-500 overflow-hidden flex items-center justify-center relative ${exportTheme === 'custom' && !['#ec4899', '#8b5cf6', '#ef4444'].includes(customColor.toLowerCase())
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-2xl'
                          : 'opacity-40 hover:opacity-100 hover:scale-105'
                          }`}
                        style={{
                          background: (exportTheme === 'custom' && !['#ec4899', '#8b5cf6', '#ef4444'].includes(customColor.toLowerCase()))
                            ? `linear-gradient(135deg, ${customColor}, ${adjustColorBrightness(customColor, -20)})`
                            : 'linear-gradient(135deg, #ff0080, #7928ca, #0070f3)'
                        }}
                      >
                        <div className="absolute inset-0 bg-white/5 group-hover/color:bg-white/15 transition-colors" />
                        <Palette className={`w-4 h-4 relative z-10 transition-colors ${exportTheme === 'custom' ? 'text-white' : 'text-white/60'}`} />
                      </button>
                    </ColorPicker>
                  </div>

                  {/* Action Buttons BELOW Palette */}
                  <div className="flex gap-3 w-full justify-center">
                    <button
                      onClick={() => handleExport('copy')}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white backdrop-blur-md active:scale-95 disabled:opacity-50"
                    >
                      {showCopiedToast ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span>{showCopiedToast ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('download')}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white backdrop-blur-md active:scale-95 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Save Photo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: COMPOSITION MODULE */}
              <div className={`w-full lg:w-[42%] flex flex-col gap-8 justify-between p-10 rounded-[4rem] bg-white/[0.02] border border-white/5 shadow-2xl ${mobileTab === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="flex flex-col gap-8">
                  <div>
                    <h2 className="text-3xl font-sync font-bold uppercase text-white tracking-tighter mb-2">Compose Note</h2>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Craft your valentine message</p>
                  </div>

                  <div className="flex gap-4 p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex-1 flex items-center gap-3 border-r border-white/10 pr-4">
                      <img src={sender.avatar_url} className="w-8 h-8 rounded-full border border-white/20" />
                      <div className="overflow-hidden">
                        <div className="text-[9px] text-white/40 font-mono uppercase tracking-wider mb-0.5">From</div>
                        <div className="text-xs font-bold text-white truncate">{sender.display_name}</div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 pl-2">
                      {recipientType === 'community' ? (
                        <div className="w-8 h-8 rounded-full bg-mb-purple/20 flex items-center justify-center border border-mb-purple/40">
                          <img src="/comm.png" className="w-4 h-4 opacity-80" />
                        </div>
                      ) : (
                        <img src={recipient?.avatar_url} className="w-8 h-8 rounded-full border border-white/20" />
                      )}
                      <div className="overflow-hidden">
                        <div className="text-[9px] text-white/40 font-mono uppercase tracking-wider mb-0.5">To</div>
                        <div className="text-xs font-bold text-white truncate">
                          {recipientType === 'community' ? 'The Community' : recipient?.display_name || recipientUsername}
                        </div>
                      </div>
                      <button onClick={() => setStep('recipient')} className="text-[9px] text-mb-purple hover:underline font-mono uppercase tracking-wider ml-auto">Edit</button>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/40">Message</label>
                      <span className={`text-[9px] font-mono transition-colors ${remainingChars < 20 ? 'text-red-400' : 'text-white/30'}`}>
                        {remainingChars} chars
                      </span>
                    </div>
                    <div className="relative bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-1 transition-all group-focus-within:border-mb-purple/40 group-focus-within:bg-white/[0.05] shadow-inner">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                          if (e.target.value.length <= MAX_CHARS) {
                            setMessage(e.target.value);
                          }
                        }}
                        placeholder="Pour your heart out..."
                        className="w-full h-40 px-5 py-8 bg-transparent text-white text-sm leading-relaxed placeholder:text-white/10 focus:outline-none resize-none font-sans text-center"
                        style={{ overflowWrap: 'anywhere' }}
                        maxLength={MAX_CHARS}
                      />
                    </div>
                  </div>

                </div>

                <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                  <motion.button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(139, 92, 246, 0.2)" }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-5 rounded-full bg-white/[0.08] border border-mb-purple text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-white/[0.15] hover:text-white backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="relative z-10">{isEdit ? 'Update Valentine' : 'Send Valentine'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Export Container - Fixed 850px (650+200 padding) to ensure glow isn't clipped */}
      <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none" aria-hidden="true">
        <div ref={exportRef} style={{ width: '730px', height: '730px', background: 'transparent', padding: '40px' }}>
          {sender && (
            <ValentineCard valentine={previewValentine} showShadow={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateValentineModal;
