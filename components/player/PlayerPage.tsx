import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Download, Search } from 'lucide-react';
import CardPerimeterMark from './CardPerimeterMark';
import PlayerLookupCard from './PlayerLookupCard';
import UnifiedPlayerCard from './UnifiedPlayerCard';
import BestTweetCard from './BestTweetCard';
import { Player, Tweet } from '@/types';
import { mockPlayer, mockTweet, delay } from '@/utils/mockData';
import { computePlayerMagicianScore, computeMagicianScores } from '@/utils/magicianScore';
import { fetchLeaderboardData, findUserByIdentifier, fetchTweetByUrl } from '@/services/dataService';
import { getRarityConfig } from '@/utils/rarity';
import { normalizeTwitterCdnUrl } from './UnifiedPlayerCard';

const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOBILE_CARD_BASE_WIDTH = 1400;
const MOBILE_CARD_BASE_HEIGHT = 760;

async function convertImagesToDataURLs(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));

  const conversionPromises = imgs.map(async (img) => {
    // Skip already converted data URLs
    if (img.src.startsWith('data:')) {
      return;
    }

    try {
      // Create a temporary image with CORS enabled
      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error(`Failed to load: ${img.src}`));

        // Normalize Twitter CDN URLs
        const normalizedSrc = normalizeTwitterCdnUrl(img.src);
        tempImg.src = normalizedSrc || img.src;

        // Timeout after 3 seconds
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });

      // Convert to data URL using canvas
      const canvas = document.createElement('canvas');
      canvas.width = tempImg.naturalWidth || tempImg.width;
      canvas.height = tempImg.naturalHeight || tempImg.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(tempImg, 0, 0);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Replace the original image src with data URL
      img.src = dataUrl;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');

      console.log('Converted image to data URL:', img.alt || 'unnamed');
    } catch (err) {
      console.warn('Failed to convert image to data URL:', img.src, err);
      // Replace failed images with transparent pixel to prevent download errors
      // Keep avatars (profile images) with original src, replace tweet images
      if (!img.src.includes('ui-avatars.com') && !img.classList.contains('rounded-full')) {
        img.src = TRANSPARENT_PIXEL;
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      }
    }
  });

  await Promise.all(conversionPromises);
}

async function ensureImagesReady(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const bgElements = Array.from(root.querySelectorAll("*")).filter(el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && bg.includes('url(');
  });

  const timeoutPromise = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const loaders = [
    ...imgs.map((img) => {
      return Promise.race([
        new Promise<void>((resolve) => {
          // If image is already loaded successfully, resolve immediately
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const onDone = async () => {
            img.removeEventListener("load", onDone);
            img.removeEventListener("error", onDone);

            // Only replace with transparent pixel if truly failed
            if (!img.naturalWidth || img.naturalWidth === 0) {
              console.warn('Image failed to load:', img.src);
              // Keep avatars with original src, replace other failed images (including tweet images)
              const isAvatar = img.classList.contains('rounded-full') || img.src.includes('ui-avatars.com');
              if (!isAvatar) {
                img.src = TRANSPARENT_PIXEL;
                img.srcset = "";
                img.removeAttribute("sizes");
              }
            } else {
              // Successfully loaded, try to decode
              try {
                if (img.decode) await img.decode();
              } catch (e) {
                console.warn("Image decode failed but image loaded", e);
              }
            }
            resolve();
          };

          img.addEventListener("load", onDone);
          img.addEventListener("error", onDone);

          // Trigger reload if needed (for CORS images)
          if (!img.complete) {
            const currentSrc = img.src;
            img.src = '';
            img.src = currentSrc;
          }
        }),
        // Longer timeout for external images like avatars
        timeoutPromise(3000).then(() => {
          if (!img.complete || img.naturalWidth === 0) {
            console.warn('Image timeout, but keeping original src:', img.src);
            // Don't replace with transparent - keep trying
          }
        })
      ]);
    }),
    ...bgElements.map((el) => {
      return Promise.race([
        new Promise<void>((resolve) => {
          const bg = window.getComputedStyle(el).backgroundImage;
          const urlMatch = bg.match(/url\((['"]?)(.*?)\1\)/);
          if (urlMatch && urlMatch[2]) {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";
            tempImg.onload = () => resolve();
            tempImg.onerror = () => {
              (el as HTMLElement).style.backgroundImage = 'none';
              resolve();
            };
            tempImg.src = urlMatch[2];
          } else {
            resolve();
          }
        }),
        timeoutPromise(3000)
      ]);
    })
  ];

  await Promise.all(loaders);

  // Additional delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 300));
}

const RotatingLetter: React.FC<{ letter: string }> = ({ letter }) => {
  return (
    <motion.span
      style={{ display: 'inline-block', transformStyle: 'preserve-3d', perspective: '1000px' }}
      whileHover={{
        rotateX: -360,
        color: '#8B5CF6',
        transition: { duration: 0.8, ease: "easeInOut" }
      }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </motion.span>
  );
};

const CharacterFlip: React.FC<{ char: string; index: number; isLink?: boolean }> = React.memo(({ char, index, isLink }) => {
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-[0.25em] font-bold inline-block transition-all duration-300 ${isLink ? 'hover:text-mb-purple' : ''}`}
      style={{
        opacity: isLink ? 0.7 : 0.5,
        color: isLink ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
        transitionDelay: `${index * 0.01}s`
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
});

const InteractiveCredits = () => {
  const segments = [
    { text: "created by ", link: false },
    { text: "ixkairo", link: true, href: "https://x.com/ixkairo" }
  ];

  let charIndexCounter = 0;

  return (
    <div className="flex pointer-events-auto select-none gap-0">
      {segments.map((segment, sIdx) => {
        const chars = segment.text.split('');
        const segmentBase = charIndexCounter;
        charIndexCounter += chars.length;

        if (segment.link) {
          return (
            <a
              key={sIdx}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex group/credit"
            >
              {chars.map((char, cIdx) => (
                <CharacterFlip key={cIdx} char={char} index={segmentBase + cIdx} isLink />
              ))}
            </a>
          );
        }

        return (
          <div key={sIdx} className="flex">
            {chars.map((char, cIdx) => (
              <CharacterFlip key={cIdx} char={char} index={segmentBase + cIdx} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const PlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const staticCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dashboardScale, setDashboardScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileCardScale, setMobileCardScale] = useState(0.27);
  const [isRectangularExport, setIsRectangularExport] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [downloadMode, setDownloadMode] = useState<'withBackground' | 'fullscreen'>('fullscreen');
  const [isExiting, setIsExiting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Disable scrolling on page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Dynamic Dashboard Scaling - Ensures the card fits perfectly without scroll
  useEffect(() => {
    const calculateScale = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);

      if (mobile) {
        const widthScale = (window.innerWidth - 12) / MOBILE_CARD_BASE_WIDTH;
        const heightScale = (window.innerHeight - (player ? 210 : 140)) / MOBILE_CARD_BASE_HEIGHT;
        const nextMobileScale = Math.max(0.2, Math.min(widthScale, heightScale, 0.42));
        setMobileCardScale(nextMobileScale);
        setDashboardScale(1);
        return;
      }

      const contentWidth = player
        ? (mobile ? 1480 : 1550)
        : (mobile ? 1180 : 1350);
      const contentHeight = player
        ? (mobile ? 940 : 860)
        : (mobile ? 680 : 600);

      const padW = mobile ? 16 : 40;
      const padH = mobile ? 120 : 60;

      const availW = Math.max(320, window.innerWidth - padW);
      const availH = Math.max(320, window.innerHeight - padH);

      const scale = Math.min(1.15, availW / contentWidth, availH / contentHeight);
      setDashboardScale(scale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [player]);

  const isMobileClient = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png', 1.0);
    });
  };

  const saveImageBlob = async (blob: Blob, filename: string) => {
    const mobile = isMobileClient();

    if (mobile && typeof navigator.share === 'function') {
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
        if (canShareFiles) {
          await navigator.share({ files: [file], title: filename });
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

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

  const copyImageBlobWithFallback = async (blob: Blob, fallbackFilename: string) => {
    const canCopyImage =
      typeof navigator !== 'undefined' &&
      typeof navigator.clipboard?.write === 'function' &&
      typeof (window as any).ClipboardItem !== 'undefined';

    if (canCopyImage) {
      try {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 3000);
        return;
      } catch (err) {
        console.warn('Clipboard copy failed, using save/share fallback', err);
      }
    }

    await saveImageBlob(blob, fallbackFilename);
  };

  const handleDownload = async () => {
    if (downloadMode === 'withBackground') {
      return handleDownloadWithBackground();
    }

    if (!staticCardRef.current || !player) return;
    setIsExporting(true);
    setIsRectangularExport(downloadMode === 'fullscreen'); // Sharp corners for fullscreen export

    try {
      await convertImagesToDataURLs(staticCardRef.current);
      await ensureImagesReady(staticCardRef.current);
      await new Promise(resolve => setTimeout(resolve, 300)); // Slightly longer for stability

      const { toPng } = await import('html-to-image');
      const cardDataUrl = await toPng(staticCardRef.current, {
        quality: 1.0,
        pixelRatio: 2, // 1400 * 2 = 2800px width
        cacheBust: true,
        skipFonts: true,
        backgroundColor: 'transparent',
      });

      const cardImg = new Image();
      await new Promise((resolve, reject) => {
        cardImg.onload = resolve;
        cardImg.onerror = reject;
        cardImg.src = cardDataUrl;
      });

      // Target resolution for Fullscreen (Reduced from 2800 to 2773 to trim left)
      const canvasW = 2773;
      const canvasH = 1236;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed');

      // Fill background with black (No effects, clean)
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Center the Card vertically, and shift -27px horizontally to "trim the left"
      const x = ((2800 - cardImg.width) / 2) - 27;
      const y = (canvasH - cardImg.height) / 2;
      ctx.drawImage(cardImg, x, y);

      const outputBlob = await canvasToBlob(canvas);
      await saveImageBlob(outputBlob, `magicblock - fullscreen - ${player.username || player.twitterUsername}.png`);
    } catch (err: any) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      setIsRectangularExport(false); // Reset to rounded for next time/UI
    }
  };

  const handleDownloadWithBackground = async () => {
    if (!staticCardRef.current || !player) return;
    setIsExporting(true);
    try {
      // Convert all images to data URLs first to avoid CORS issues
      await convertImagesToDataURLs(staticCardRef.current);
      await ensureImagesReady(staticCardRef.current);
      await new Promise(resolve => setTimeout(resolve, 300));

      const { toPng } = await import('html-to-image');
      const cardDataUrl = await toPng(staticCardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: 'transparent',
      });

      const cardImg = new Image();
      await new Promise((resolve, reject) => {
        cardImg.onload = resolve;
        cardImg.onerror = reject;
        cardImg.src = cardDataUrl;
      });

      // Fixed Target Dimensions
      const canvasW = 4600;
      const canvasH = 2314;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed');

      const bgImg = new Image();
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
        bgImg.src = '/img/penis.jpg';
      });

      // Background Scaling - Fill 4600x2314 completely
      const scale = Math.max(canvasW / bgImg.width, canvasH / bgImg.height);
      const bgW = bgImg.width * scale;
      const bgH = bgImg.height * scale;
      const bgX = (canvasW - bgW) / 2;
      const bgY = (canvasH - bgH) / 2;

      // Draw background with reduced brightness
      ctx.filter = 'brightness(0.7)';
      ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);
      ctx.filter = 'none';

      // Overall darkening layer
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Extremely strong radial gradient behind card for maximum contrast
      const gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) * 0.7);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Center the Card Image on the 4600x2314 canvas
      const x = (canvasW - cardImg.width) / 2;
      const y = (canvasH - cardImg.height) / 2;
      ctx.drawImage(cardImg, x, y);

      const outputBlob = await canvasToBlob(canvas);
      await saveImageBlob(outputBlob, `magicblock - ${player.username || player.twitterUsername}.png`);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    // If withBackground mode, convert to blob and copy
    if (downloadMode === 'withBackground') {
      if (!staticCardRef.current || !player) return;
      setIsExporting(true);
      try {
        await convertImagesToDataURLs(staticCardRef.current);
        await ensureImagesReady(staticCardRef.current);
        await new Promise(resolve => setTimeout(resolve, 300));

        const { toPng } = await import('html-to-image');
        const cardDataUrl = await toPng(staticCardRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          cacheBust: true,
          skipFonts: true,
          backgroundColor: 'transparent',
        });

        const cardImg = new Image();
        await new Promise((resolve, reject) => {
          cardImg.onload = resolve;
          cardImg.onerror = reject;
          cardImg.src = cardDataUrl;
        });

        const canvasW = 4600;
        const canvasH = 2314;

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed');

        const bgImg = new Image();
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = '/img/penis.jpg';
        });

        const scale = Math.max(canvasW / bgImg.width, canvasH / bgImg.height);
        const bgW = bgImg.width * scale;
        const bgH = bgImg.height * scale;
        const bgX = (canvasW - bgW) / 2;
        const bgY = (canvasH - bgH) / 2;

        ctx.filter = 'brightness(0.7)';
        ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);
        ctx.filter = 'none';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvasW, canvasH);

        const gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) * 0.7);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasW, canvasH);

        const x = (canvasW - cardImg.width) / 2;
        const y = (canvasH - cardImg.height) / 2;
        ctx.drawImage(cardImg, x, y);

        const outputBlob = await canvasToBlob(canvas);
        await copyImageBlobWithFallback(outputBlob, `magicblock - ${player.username || player.twitterUsername}.png`);
      } catch (err: any) {
        alert(`Copy failed: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
      return;
    }

    if (!staticCardRef.current || !player) return;
    setIsExporting(true);
    setIsRectangularExport(downloadMode === 'fullscreen');

    try {
      await convertImagesToDataURLs(staticCardRef.current);
      await ensureImagesReady(staticCardRef.current);
      await new Promise(resolve => setTimeout(resolve, 300));

      const { toPng } = await import('html-to-image');
      const cardDataUrl = await toPng(staticCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: 'transparent',
      });

      const cardImg = new Image();
      await new Promise((resolve, reject) => {
        cardImg.onload = resolve;
        cardImg.onerror = reject;
        cardImg.src = cardDataUrl;
      });

      const canvasW = 2773;
      const canvasH = 1236;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed');

      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, canvasW, canvasH);

      const x = ((2800 - cardImg.width) / 2) - 27;
      const y = (canvasH - cardImg.height) / 2;
      ctx.drawImage(cardImg, x, y);

      const outputBlob = await canvasToBlob(canvas);
      await copyImageBlobWithFallback(outputBlob, `magicblock - fullscreen - ${player.username || player.twitterUsername}.png`);
    } catch (err: any) {
      console.error('Copy failed:', err);
      alert(`Copy failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      setIsRectangularExport(false);
    }
  };

  const handleFind = async (input: string) => {
    setIsLoading(true);
    setSearchValue(input);

    try {
      const rawUsers = await fetchLeaderboardData();
      const usersWithScores = computeMagicianScores(rawUsers);
      const normalizedInput = input.trim().toLowerCase().replace(/^@/, '');

      let foundUser = usersWithScores.find(u =>
        u.username.toLowerCase() === normalizedInput ||
        (u.discord_username && u.discord_username.toLowerCase() === normalizedInput) ||
        u.display_name.toLowerCase().includes(normalizedInput)
      );

      if (!foundUser) {
        const directUser = await findUserByIdentifier(normalizedInput);
        if (directUser) {
          const rawComponents = usersWithScores.map(u => ({
            reach: Math.log1p(u.views_total),
            quality: Math.log1p(u.likes_total + 2 * u.replies_total),
            consistency: Math.log1p(u.posts_count)
          }));
          const maxReach = Math.max(...rawComponents.map(c => c.reach), 0);
          const maxQuality = Math.max(...rawComponents.map(c => c.quality), 0);
          const maxConsistency = Math.max(...rawComponents.map(c => c.consistency), 0);
          const playerWithScore = computePlayerMagicianScore(
            { ...directUser } as any,
            { maxReach, maxQuality, maxConsistency }
          );
          foundUser = { ...directUser, magicianScore: playerWithScore.magicianScore };
        }
      }

      if (!foundUser) throw new Error('Player not found');

      const mappedPlayer: Player = {
        discordId: 'unknown',
        discordUsername: foundUser.discord_username || foundUser.username,
        twitterUsername: foundUser.username,
        displayName: foundUser.display_name,
        avatarUrl: foundUser.avatar_url,
        roles: foundUser.discrod_roles
          ? foundUser.discrod_roles.split('|').map((r, i) => ({ id: `role-${i}`, name: r.trim() }))
          : [],
        posts_count: foundUser.posts_count,
        views_total: foundUser.views_total,
        likes_total: foundUser.likes_total,
        replies_total: foundUser.replies_total,
        retweets_total: foundUser.retweets_total,
        quotes_total: foundUser.quotes_total,
        magicianScore: foundUser.magicianScore,
        rank: foundUser.stable_rank,
        discord_messages_count: foundUser.discord_messages || 0,
        discord_joined_at: foundUser.discord_mgb_joined_date || undefined,
        days_in_mgb: foundUser.days_in_mgb || 0,
        best_post: foundUser.best_post,
        best_post_text: foundUser.best_post_text
      };

      await new Promise(resolve => setTimeout(resolve, 200));

      setTweet(null);
      setPlayer(mappedPlayer);

      if (foundUser.best_post) {
        const bestTweet = await fetchTweetByUrl(foundUser.best_post);
        if (bestTweet) {
          setTweet(bestTweet);
        } else {
          setTweet({
            id: 'partial-' + Date.now(),
            tweetId: foundUser.best_post.match(/\/status\/(\d+)/)?.[1] || '',
            text: foundUser.best_post_text || '',
            url: foundUser.best_post,
            likes: 0,
            retweets: 0,
            replies: 0,
            views: 0,
            quotes: 0,
            createdAt: foundUser.last_updated || new Date().toISOString()
          } as Tweet);
        }
      }

      if (normalizedInput === 'testuser') {
        setPlayer(computePlayerMagicianScore(mockPlayer));
        setTweet(mockTweet);
      }
    } catch (err) {
      console.error(err);
      if (input.toLowerCase().includes('mock')) {
        setPlayer(computePlayerMagicianScore(mockPlayer));
        setTweet(mockTweet);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (player) {
      setIsExiting(true);
      setTimeout(() => {
        setPlayer(null);
        setTweet(null);
        setIsExiting(false);
      }, 300);
    } else {
      navigate('/leaderboard', { state: { skipLanding: true } });
    }
  };

  const handleLeaderboardClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/leaderboard', { state: { skipLanding: true } });
    }, 300);
  };

  return (
    <div
      className="relative h-[100dvh] w-screen bg-transparent text-white overflow-hidden flex flex-col items-center justify-center"
      style={isMobileViewport && player ? { touchAction: 'none', overscrollBehavior: 'none' } : undefined}
    >
      {/* Ambient Light Sources - Reduced Intensity */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[150vw] h-[100vh] bg-white/[0.025] blur-[250px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="w-[80%] h-[120%] bg-white/[0.06] blur-[180px] rounded-full animate-pulse will-change-transform" style={{ transform: 'translateZ(0)', animationDuration: '4s' }} />
          <div className="absolute w-[40%] h-[80%] bg-white/[0.075] blur-[100px] rounded-full mix-blend-screen will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="absolute w-[20%] h-[40%] bg-white/[0.15] blur-[60px] rounded-full mix-blend-plus-lighter will-change-transform" style={{ transform: 'translateZ(0)' }} />
          <div className="absolute top-0 w-full h-[400px] bg-gradient-to-b from-white/[0.04] to-transparent blur-[120px] will-change-transform" style={{ transform: 'translateZ(0)' }} />
        </div>
      </div>

      {/* Radial Darkening */}
      <div className="fixed inset-0 z-[5] pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[200%] max-w-none h-full will-change-transform" style={{
          transform: 'translateZ(0)',
          background: 'radial-gradient(ellipse 50% 100% at 50% 50%, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.75) 15%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.04) 85%, transparent 100%)'
        }} />
      </div>

      {/* Back Button - Fixed at top left corner */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
        onClick={handleBackClick}
        whileHover={{ x: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-3 md:top-6 md:left-6 z-[100] flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-[8px] md:text-[11px] font-bold uppercase tracking-[0.16em] md:tracking-[0.25em] text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_1px_rgba(255,255,255,0.3)_inset] backdrop-blur-md group/back shrink-0 pointer-events-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover/back:-translate-x-1" />
        <span>Back</span>
      </motion.button>

      {/* Leaderboard Button - Fixed at top right corner */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
        onClick={handleLeaderboardClick}
        whileHover={{ x: 6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 right-3 md:top-6 md:right-6 z-[100] flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-[8px] md:text-[11px] font-bold uppercase tracking-[0.16em] md:tracking-[0.25em] text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_1px_rgba(255,255,255,0.3)_inset] backdrop-blur-md group/board shrink-0 pointer-events-auto"
      >
        <span>Leaderboard</span>
      </motion.button>

      {/* Content Scaling Container - Leaderboard Style */}
      <div className="relative z-[40] w-full flex flex-col items-center pointer-events-auto">
        <div
          className="w-full max-w-6xl mx-auto px-3 sm:px-5 md:px-12 flex flex-col items-center"
          style={!isMobileViewport ? { zoom: dashboardScale } : undefined}
        >
          {/* Top Bar: Long Search - Only visible when player exists */}
          {player && !isMobileViewport && (
            <div className="w-full flex items-center gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: isExiting ? 0 : 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative max-w-2xl mx-auto group"
              >
                <div className="absolute inset-0 bg-white/[0.07] border border-white/20 rounded-full group-focus-within:bg-white/[0.12] group-focus-within:border-mb-purple/60 group-hover:border-white/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-mb-purple transition-colors z-10 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchValue.trim()) {
                        handleFind(searchValue);
                      }
                    }
                  }}
                  placeholder="Search for another player..."
                  className="relative w-full pl-12 pr-4 py-2.5 bg-transparent text-white text-sm font-medium placeholder:text-white/30 focus:outline-none transition-all pointer-events-auto"
                />
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-mb-purple/0 group-focus-within:bg-mb-purple/80 transition-all duration-500 scale-x-0 group-focus-within:scale-x-100 origin-center" />
              </motion.div>
            </div>
          )}

          {/* Page Content Holder */}
          <div className="relative w-full min-h-[420px] md:min-h-[600px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!player ? (
                <motion.div
                  key="lookup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-[1400px] mx-auto w-full"
                >
                  {/* Isolated Title for Lookup State - Leaderboard Style */}
                  <div className="mb-6 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
                      <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-mb-purple font-bold">create your magiccard</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-sync font-bold tracking-tighter uppercase text-white leading-none">
                      MagicCard <span className="text-white/40 font-sans font-bold text-lg md:text-2xl tracking-[0.2em] ml-3">Lookup</span>
                    </h1>
                  </div>
                  <PlayerLookupCard onFind={handleFind} />
                </motion.div>
              ) : (() => {
                const rarity = getRarityConfig(player.magicianScore || 0, player.roles?.map(r => r.name), player.twitterUsername || player.discordUsername);
                return (
                  <motion.div
                    key={`profile-${player.twitterUsername || player.discordUsername}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExiting ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full max-w-[1400px] mx-auto"
                  >
                    {/* WIDE SHOWCASE STAGE */}
                    <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center pb-6 md:pb-20 px-2 md:px-4 gap-4 md:gap-8">

                      {/* FLOATING HEADER ACTIONS (Above the Card) - Leaderboard Style */}
                      <div className="w-full max-w-[1400px] flex flex-col gap-3 md:gap-4 md:flex-row md:justify-between md:items-end">
                        <div className={`self-start w-full md:w-auto md:-ml-40 ${isMobileViewport ? 'hidden' : ''}`}>
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-mb-purple shadow-[0_0_10px_#8B5CF6]" />
                              <span className="text-[8px] md:text-[9px] font-mono tracking-[0.3em] md:tracking-[0.4em] uppercase text-mb-purple font-bold">magiccard profile</span>
                            </div>
                            <h2 className={`font-sync font-bold tracking-tighter uppercase text-white leading-none flex items-baseline ${(player.twitterUsername || player.discordUsername || '').length > 18
                              ? 'text-xl md:text-2xl'
                              : (player.twitterUsername || player.discordUsername || '').length > 14
                                ? 'text-2xl md:text-3xl'
                                : (player.twitterUsername || player.discordUsername || '').length > 10
                                  ? 'text-2xl md:text-4xl'
                                  : 'text-2xl md:text-5xl'
                              }`}>
                              <span className="flex-shrink-0 whitespace-nowrap">{player.twitterUsername || player.discordUsername}</span>
                              <span className="text-white/40 font-sans font-bold text-sm md:text-2xl tracking-[0.2em] ml-2 md:ml-3 flex-shrink-0 whitespace-nowrap">MagicCard</span>
                            </h2>
                          </motion.div>
                        </div>

                        <div className={`w-full md:w-auto flex flex-wrap items-center ${isMobileViewport ? 'justify-center' : 'justify-start md:justify-end'} gap-2 md:gap-4 md:ml-auto relative md:-right-40`}>
                          {/* Challenge Button - Glowing */}
                          <motion.a
                            href="https://x.com/ixkairo/status/2018796261176918445"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                              boxShadow: [
                                '0 0 20px rgba(139, 92, 246, 0.3)',
                                '0 0 30px rgba(139, 92, 246, 0.5)',
                                '0 0 20px rgba(139, 92, 246, 0.3)',
                              ],
                            }}
                            transition={{
                              boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              },
                            }}
                            className="hidden md:flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-mb-purple/20 border border-mb-purple/60 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-mb-purple transition-all duration-300 hover:bg-mb-purple/30 hover:border-mb-purple hover:text-white hover:shadow-[0_0_25px_rgba(139, 92, 246, 0.6)] backdrop-blur-md"
                          >
                            <span>Challenge</span>
                          </motion.a>

                          {/* Mode Toggle */}
                          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
                            <button
                              onClick={() => setDownloadMode('fullscreen')}
                              className={`text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${downloadMode === 'fullscreen'
                                ? 'text-mb-purple'
                                : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                              Full
                            </button>
                            <div className="relative w-8 md:w-10 h-4 md:h-5 rounded-full bg-white/10 cursor-pointer flex-shrink-0" onClick={() => setDownloadMode(downloadMode === 'fullscreen' ? 'withBackground' : 'fullscreen')}>
                              <motion.div
                                className="absolute top-0.5 left-0.5 w-3 md:w-4 h-3 md:h-4 rounded-full bg-mb-purple shadow-[0_0_10px_rgba(139, 92, 246, 0.5)]"
                                animate={{ x: downloadMode === 'withBackground' ? 16 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </div>
                            <button
                              onClick={() => setDownloadMode('withBackground')}
                              className={`text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${downloadMode === 'withBackground'
                                ? 'text-mb-purple'
                                : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                              BG
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <motion.button
                            onClick={handleCopyImage}
                            disabled={isExporting}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/60 transition-all duration-300 hover:bg-white/[0.1] hover:border-white/25 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15),0_0_1px_rgba(255,255,255,0.4)_inset] backdrop-blur-md group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Copy className="w-3 md:w-3.5 h-3 md:h-3.5 transition-colors" />
                            <span className="hidden sm:inline">Copy</span>
                          </motion.button>

                          <motion.button
                            onClick={handleDownload}
                            disabled={isExporting}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/[0.08] border border-white/20 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 transition-all duration-300 hover:bg-white/[0.12] hover:border-mb-purple/60 hover:text-mb-purple hover:shadow-[0_0_20px_rgba(139, 92, 246, 0.4),0_0_1px_rgba(255,255,255,0.4)_inset] backdrop-blur-md group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="w-3 md:w-3.5 h-3 md:h-3.5 transition-colors" />
                            <span className="hidden sm:inline">Save Card</span>
                            <span className="sm:hidden">Save</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* STAGE CONTAINER - Pure Unified Component */}
                      <motion.div
                        className="relative w-full flex justify-center"
                        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                      >
                        <div
                          className="relative"
                          style={isMobileViewport ? {
                            width: `${Math.round(MOBILE_CARD_BASE_WIDTH * mobileCardScale)}px`,
                            height: `${Math.round(MOBILE_CARD_BASE_HEIGHT * mobileCardScale)}px`
                          } : undefined}
                        >
                          <div
                            className="relative"
                            style={isMobileViewport ? {
                              width: `${MOBILE_CARD_BASE_WIDTH}px`,
                              transform: `scale(${mobileCardScale})`,
                              transformOrigin: 'top left'
                            } : undefined}
                          >
                            {/* Background Layer - Animated with AnimatePresence */}
                            <AnimatePresence>
                              {downloadMode === 'withBackground' && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 0.9 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.5, ease: "easeInOut" }}
                                  className="absolute rounded-3xl overflow-hidden -z-10"
                                  style={{
                                    inset: '-40px',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)',
                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                  }}
                                >
                                  {/* Background Image - Reduced brightness */}
                                  <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                      backgroundImage: 'url(/img/penis.jpg)',
                                      filter: 'brightness(0.7)',
                                    }}
                                  />
                                  {/* Overall darkening layer */}
                                  <div
                                    className="absolute inset-0 bg-black/25"
                                  />
                                  {/* Refined radial shadow behind card for strong contrast */}
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0.1) 80%, transparent 100%)',
                                    }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <motion.div
                              animate={{ scale: downloadMode === 'withBackground' ? 0.85 : 1 }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              className="w-fit relative z-10"
                              style={{ transformOrigin: 'center center' }}
                            >
                              {/* Shadows for fullscreen mode */}
                              <AnimatePresence>
                                {downloadMode === 'fullscreen' && (
                                  <>
                                    {/* 3D Shadow Layer Behind Card */}
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.5, ease: "easeInOut" }}
                                      className="absolute inset-0 -z-10"
                                      style={{
                                        background: `radial-gradient(ellipse at center, ${rarity.glow}40 0%, ${rarity.glow}20 40%, transparent 70%)`,
                                        filter: 'blur(40px)',
                                        transform: 'translateY(20px) scale(1.05)',
                                      }}
                                    />
                                    {/* Subtle 3D Depth Shadow */}
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.5, ease: "easeInOut" }}
                                      className="absolute inset-0 -z-20"
                                      style={{
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        filter: 'blur(30px)',
                                        transform: 'translateY(30px) translateX(5px) scale(0.98)',
                                        borderRadius: '2.5rem'
                                      }}
                                    />
                                  </>
                                )}
                              </AnimatePresence>

                              <div ref={cardRef} className="w-fit">
                                <UnifiedPlayerCard
                                  player={player}
                                  tweet={tweet}
                                  isMinimal={false}
                                  isBorderless={false}
                                  isExporting={false}
                                  isIntenseGlow={true} // Always show neon glow on website UI
                                />
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* HIDDEN STATIC CAPTURE STAGE - Ensuring 100% sharp exports */}
      <div className="fixed -top-[5000px] -left-[5000px] pointer-events-none" style={{ width: 'auto', height: 'auto' }}>
        {player && (
          <div ref={staticCardRef} className="w-fit p-40 bg-transparent relative">
            <UnifiedPlayerCard
              player={player}
              tweet={tweet}
              isMinimal={false}
              isBorderless={false}
              isExporting={false}
              isRectangular={isRectangularExport}
              isIntenseGlow={downloadMode === 'withBackground'}
            />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showCopiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-8 left-0 right-0 z-[200] pointer-events-none flex justify-center"
          >
            <div className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <span className="text-[9px] font-bold uppercase text-white/60">
                Copied to Clipboard
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Page Credit */}
      <div className="fixed bottom-8 right-10 z-[100] hidden md:block select-none pointer-events-none">
        <InteractiveCredits />
      </div>

    </div>
  );
};

export default PlayerPage;
