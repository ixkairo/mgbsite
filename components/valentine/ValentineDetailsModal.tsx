import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Download, Check, Copy, Palette, Loader2, ArrowLeft } from 'lucide-react';
import { ValentineData } from '../../services/valentineService';
import ValentineCard from './ValentineCard';
import { normalizeTwitterCdnUrl } from '../player/UnifiedPlayerCard';
import { ColorPicker } from '../ui/color-picker';

type ExportTheme = 'pink' | 'purple' | 'red' | 'image' | 'custom';

// --- Shared Helpers (Copied from CreateValentineModal) ---
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

function adjustColorBrightness(hex: string, percent: number) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.floor(Math.min(255, Math.max(0, r * (1 + percent / 100))));
    g = Math.floor(Math.min(255, Math.max(0, g * (1 + percent / 100))));
    b = Math.floor(Math.min(255, Math.max(0, b * (1 + percent / 100))));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface ValentineDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    valentine: ValentineData | null;
}

const ValentineDetailsModal: React.FC<ValentineDetailsModalProps> = ({
    isOpen,
    onClose,
    valentine
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showCopiedToast, setShowCopiedToast] = useState(false);
    const [exportTheme, setExportTheme] = useState<ExportTheme>('image');
    const [customColor, setCustomColor] = useState('#ec4899');

    const previewRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    // Determine container styling based on theme
    const containerStyle = useMemo(() => {
        switch (exportTheme) {
            case 'pink': return { background: 'linear-gradient(to bottom, #3a2028, #0d0b0c)' };
            case 'red': return { background: 'linear-gradient(to bottom, #3d1a1a, #0d0a0a)' };
            case 'purple': return { background: 'linear-gradient(to bottom, #251e3d, #08080d)' };
            case 'custom': return { background: `linear-gradient(to bottom, ${adjustColorBrightness(customColor, -75)}, ${adjustColorBrightness(customColor, -88)})` };
            case 'image': return { background: 'none' }; // Will use img tag
            default: return { background: 'none' };
        }
    }, [exportTheme, customColor]);

    const handleExport = async (mode: 'download' | 'copy') => {
        if (!exportRef.current || !valentine) return;
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

            // Theme Colors Logic (Same as CreateValentineModal)
            let bgFrom, bgTo, glowColor, glowStop, bgImage: HTMLImageElement | null = null;

            if (exportTheme === 'image') {
                bgImage = new Image();
                bgImage.src = '/heartbg1.jpg';
                await new Promise((resolve) => {
                    if (!bgImage) return resolve(null);
                    bgImage.onload = resolve;
                    bgImage.onerror = () => {
                        console.warn("Failed to load background image");
                        bgImage = null;
                        resolve(null);
                    };
                });
            }

            if (exportTheme === 'pink') {
                bgFrom = '#3a2028'; bgTo = '#0d0b0c'; glowColor = 'rgba(236, 72, 153, 0.45)'; glowStop = 'rgba(236, 72, 153, 0.1)';
            } else if (exportTheme === 'red') {
                bgFrom = '#3d1a1a'; bgTo = '#0d0a0a'; glowColor = 'rgba(239, 68, 68, 0.45)'; glowStop = 'rgba(239, 68, 68, 0.1)';
            } else if (exportTheme === 'image') {
                bgFrom = '#151518'; bgTo = '#050505'; glowColor = 'rgba(255, 255, 255, 0.5)'; glowStop = 'rgba(255, 255, 255, 0.15)';
            } else if (exportTheme === 'custom') {
                glowColor = customColor + '77';
                glowStop = customColor + '1a';
                bgFrom = adjustColorBrightness(customColor, -75);
                bgTo = adjustColorBrightness(customColor, -88);
            } else {
                bgFrom = '#251e3d'; bgTo = '#08080d'; glowColor = 'rgba(139, 92, 246, 0.45)'; glowStop = 'rgba(139, 92, 246, 0.1)';
            }

            // Draw Background
            if (bgImage) {
                const imgRatio = bgImage.width / bgImage.height;
                const canvasRatio = canvasW / canvasH;
                let drawW, drawH, drawX, drawY;

                if (imgRatio > canvasRatio) {
                    drawH = canvasH; drawW = canvasH * imgRatio; drawX = (canvasW - drawW) / 2; drawY = 0;
                } else {
                    drawW = canvasW; drawH = canvasW / imgRatio; drawX = 0; drawY = (canvasH - drawH) / 2;
                }
                ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
            } else {
                const gradient = ctx.createLinearGradient(0, 0, 0, canvasH);
                gradient.addColorStop(0, bgFrom || '#101012');
                gradient.addColorStop(1, bgTo || '#050505');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvasW, canvasH);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(0, 0, canvasW, canvasH);
            }

            // Glow Drawing
            const heartImg = new Image();
            heartImg.src = '/heart1.png';
            await new Promise((resolve) => { heartImg.onload = resolve; heartImg.onerror = resolve; });

            if (heartImg.complete && heartImg.naturalWidth > 0) {
                if (exportTheme === 'image') {
                    ctx.save();
                    const spotlight = ctx.createRadialGradient(canvasW / 2, 0, 0, canvasW / 2, 0, canvasW * 0.9);
                    spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
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
                const heartScale = 0.82;
                const hW = canvasW * heartScale;
                const hH = canvasH * heartScale;
                const hX = (canvasW - hW) / 2;
                const hY = (canvasH - hH) / 2;

                ctx.globalAlpha = 0.05;
                ctx.drawImage(heartImg, hX, hY, hW, hH);
                ctx.shadowBlur = 80;
                ctx.shadowColor = exportTheme === 'custom' ? customColor + '99' : glowStop;
                ctx.drawImage(heartImg, hX, hY, hW, hH);
                ctx.restore();
            }

            // Draw Card
            const targetWidth = 1980;
            const cardScale = targetWidth / img.width;
            const drawW = img.width * cardScale;
            const drawH = img.height * cardScale;
            const x = (canvasW - drawW) / 2;
            const y = (canvasH - drawH) / 2;
            ctx.drawImage(img, x, y, drawW, drawH);

            const blob = await canvasToBlob(canvas);
            const filename = `valentine-${valentine.sender_username}-${valentine.recipient_type === 'user' ? valentine.recipient_username : 'community'}.png`;

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

    if (!isOpen || !valentine) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative z-10 w-full max-w-[500px] flex flex-col items-center gap-6 pointer-events-none"
            >
                <div className="w-full flex flex-col gap-6 pointer-events-auto">
                    {/* Main Preview Card */}
                    <div className="relative w-full aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/10 group">
                        {/* Close Button Inside */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-black/20 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all z-50 backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div
                            ref={previewRef}
                            className="relative w-full h-full transition-all duration-500 overflow-hidden"
                            style={containerStyle}
                        >
                            {/* Background Overlays */}
                            {(exportTheme !== 'image') && (
                                <div className="absolute inset-0 bg-black/15 pointer-events-none z-[1]" />
                            )}

                            {exportTheme === 'image' && (
                                <img
                                    src="/heartbg1.jpg"
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500"
                                />
                            )}

                            {/* Glow Effects */}
                            <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-500 flex items-center justify-center">
                                {exportTheme === 'image' && (
                                    <div
                                        className="absolute inset-0 z-0 pointer-events-none"
                                        style={{
                                            background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)'
                                        }}
                                    />
                                )}

                                {/* Heart Glows */}
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

                            {/* The Card Itself */}
                            <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
                                <ValentineCard valentine={valentine} showShadow={false} />
                            </div>
                        </div>

                        {/* Theme Selector Overlay (Bottom Center of Card) */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg z-20">
                            <button
                                onClick={() => setExportTheme('image')}
                                className={`w-6 h-6 rounded-full border border-white/20 overflow-hidden relative transition-all duration-300 ${exportTheme === 'image' ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                            >
                                <img src="/heartbg1.jpg" className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                            {[
                                { id: 'pink', color: '#EC4899' },
                                { id: 'purple', color: '#8B5CF6' },
                                { id: 'red', color: '#EF4444' }
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => setExportTheme(preset.id as any)}
                                    className={`w-6 h-6 rounded-full transition-all duration-300 relative ${exportTheme === preset.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                                    style={{ backgroundColor: preset.color }}
                                />
                            ))}
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <ColorPicker
                                color={customColor}
                                useHex={true}
                                onChange={(newColor) => {
                                    setCustomColor(newColor);
                                    setExportTheme('custom');
                                }}
                            >
                                <button
                                    className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition-all ${exportTheme === 'custom' ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                    style={{
                                        background: (exportTheme === 'custom')
                                            ? customColor
                                            : 'linear-gradient(135deg, #ff0080, #7928ca, #0070f3)'
                                    }}
                                >
                                    <Palette className="w-3 h-3 text-white drop-shadow-md" />
                                </button>
                            </ColorPicker>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center w-full">
                        <button
                            onClick={() => handleExport('copy')}
                            disabled={isExporting}
                            className="flex-1 py-4 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all text-white font-bold uppercase tracking-wider text-xs backdrop-blur-md flex items-center justify-center gap-2 group"
                        >
                            {showCopiedToast ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60 group-hover:text-white" />}
                            <span>{showCopiedToast ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                            onClick={() => handleExport('download')}
                            disabled={isExporting}
                            className="flex-[2] py-4 rounded-2xl bg-white text-black hover:bg-white/90 transition-all font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>Save Photo</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Hidden Export Container */}
            <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none" aria-hidden="true">
                <div ref={exportRef} style={{ width: '730px', height: '730px', background: 'transparent', padding: '40px' }}>
                    <ValentineCard valentine={valentine} showShadow={false} />
                </div>
            </div>
        </div>
    );
};

export default ValentineDetailsModal;
