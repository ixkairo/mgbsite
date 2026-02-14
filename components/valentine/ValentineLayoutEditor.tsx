import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Move } from 'lucide-react';
import { LayoutElement, LayoutConfig, DEFAULT_LAYOUT } from './layoutConfig';
import { getRarityConfig, getRoleColor } from '../../utils/rarity';
import HeartContainer from './HeartContainer';

interface ValentineLayoutEditorProps {
  sender: any;
  message: string;
  recipientType: 'community' | 'user';
  recipient: any;
  onSave: (layout: LayoutConfig) => void;
  onClose: () => void;
}

const ValentineLayoutEditor: React.FC<ValentineLayoutEditorProps> = ({
  sender,
  message,
  recipientType,
  recipient,
  onSave,
  onClose
}) => {
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const rarity = React.useMemo(() => {
    const score = sender?.magicianScore ?? 0;
    const roles = sender?.discrod_roles ? sender.discrod_roles.split(/[,\-|]/).map((r: string) => r.trim()) : [];
    return getRarityConfig(score, roles, sender?.username);
  }, [sender]);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelected(id);
    const element = layout[id as keyof LayoutConfig];
    setDragging(id);
    setDragOffset({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  };

  const updateElementProperty = (id: string, property: keyof LayoutElement, value: number) => {
    setLayout(prev => ({
      ...prev,
      [id]: {
        ...prev[id as keyof LayoutConfig],
        [property]: value
      }
    }));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setLayout(prev => ({
      ...prev,
      [dragging]: {
        ...prev[dragging as keyof LayoutConfig],
        x: Math.max(-100, Math.min(x, rect.width - prev[dragging as keyof LayoutConfig].width + 100)),
        y: Math.max(-100, Math.min(y, rect.height - prev[dragging as keyof LayoutConfig].height + 100))
      }
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, dragOffset]);

  const handleSave = () => {
    localStorage.setItem('valentineLayout', JSON.stringify(layout));
    onSave(layout);
  };

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('valentineLayout');
  };

  const updateSize = (id: string, delta: number) => {
    setLayout(prev => ({
      ...prev,
      [id]: {
        ...prev[id as keyof LayoutConfig],
        width: Math.max(50, prev[id as keyof LayoutConfig].width + delta),
        height: Math.max(50, prev[id as keyof LayoutConfig].height + delta)
      }
    }));
  };

  const updateFontSize = (id: string, delta: number) => {
    setLayout(prev => ({
      ...prev,
      [id]: {
        ...prev[id as keyof LayoutConfig],
        fontSize: Math.max(6, (prev[id as keyof LayoutConfig].fontSize || 12) + delta)
      }
    }));
  };

  const recipientText = recipientType === 'community' ? 'community' : `@${recipient?.username}`;

  const elementNames: Record<string, string> = {
    avatar: 'Avatar',
    username: 'Username',
    recipientAvatar: 'Recipient Avatar',
    recipientUsername: 'Recipient Username',
    loveNote: 'Love Note Label',
    message: 'Message',
    fromTo: 'From → To'
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 gap-6">
      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-6 py-3">
        <Move className="w-4 h-4 text-mb-purple" />
        <span className="text-white font-bold text-sm">Layout Editor - Click to select, drag to move</span>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/60 border border-white/10 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 border border-mb-purple/60 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)]"
        >
          <Save className="w-3.5 h-3.5" />
          Save & Close
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="relative w-full max-w-[700px] aspect-square overflow-hidden scale-[0.9]">
        <HeartContainer
          glowColor={rarity.glow}
          valentineStyle={rarity.valentine}
          maskedChildren={(
            <div className="w-full h-full relative">
              <div
                className="absolute z-0 pointer-events-none"
                style={{
                  left: layout.avatar.x + (layout.avatar.width / 2) - (layout.avatar.width * 3.1 / 2) + 117,
                  top: layout.avatar.y + (layout.avatar.height / 2) - (layout.avatar.height * 3.1 / 2) + 117,
                  width: layout.avatar.width * 3.1,
                  height: layout.avatar.height * 3.1
                }}
              >
                <img
                  src={sender.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover opacity-15 grayscale-[0.2]"
                  style={{
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
                  }}
                />
              </div>

              {recipientType === 'user' && recipient?.avatar_url && (
                <div
                  className="absolute z-0 pointer-events-none"
                  style={{
                    left: layout.recipientAvatar.x + (layout.recipientAvatar.width / 2) - (layout.recipientAvatar.width * 3.1 / 2) + 117,
                    top: layout.recipientAvatar.y + (layout.recipientAvatar.height / 2) - (layout.recipientAvatar.height * 3.1 / 2) + 117,
                    width: layout.recipientAvatar.width * 3.1,
                    height: layout.recipientAvatar.height * 3.1
                  }}
                >
                  <img
                    src={recipient.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover opacity-15 grayscale-[0.2]"
                    style={{
                      maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        >
          <div
            ref={containerRef}
            className="absolute inset-0 z-[10]"
          >

            <div
              onMouseDown={(e) => handleMouseDown('avatar', e)}
              className={`absolute cursor-move border-2 ${dragging === 'avatar' || selected === 'avatar' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-dashed border-white/30'} rounded-full transition-all`}
              style={{
                left: layout.avatar.x,
                top: layout.avatar.y,
                width: layout.avatar.width,
                height: layout.avatar.height
              }}
            >
              <div className={`w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/20 font-bold`}>
                <img
                  src={sender.avatar_url}
                  alt={sender.display_name}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
              {/* Rarity Icon Accent */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${rarity.bgSolid} ${rarity.text} flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg`}>
                <rarity.icon className="w-3.5 h-3.5" />
              </div>
              <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                Avatar ({layout.avatar.width}px)
              </div>
            </div>

            <div
              onMouseDown={(e) => handleMouseDown('username', e)}
              className={`absolute cursor-move border-2 ${dragging === 'username' || selected === 'username' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-dashed border-white/30'} rounded-lg p-2 transition-all`}
              style={{
                left: layout.username.x,
                top: layout.username.y,
                width: layout.username.width,
                height: layout.username.height,
                fontSize: layout.username.fontSize
              }}
            >
              <div className="text-white font-bold truncate leading-tight">{sender.display_name}</div>
              <div
                className="font-mono uppercase tracking-wider truncate"
                style={{
                  fontSize: `${(layout.username.fontSize || 10) * 0.7}px`,
                  color: getRoleColor(sender.role || ''),
                  foregroundShadow: `0 0 8px ${getRoleColor(sender.role || '')}44`
                }}
              >
                {sender.role || 'ROLE'}
              </div>
              <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                Username ({layout.username.fontSize}px)
              </div>
            </div>

            {recipientType === 'user' && recipient?.avatar_url && (
              <div
                onMouseDown={(e) => handleMouseDown('recipientAvatar', e)}
                className={`absolute cursor-move border-2 ${dragging === 'recipientAvatar' || selected === 'recipientAvatar' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-dashed border-white/30'} rounded-full transition-all`}
                style={{
                  left: layout.recipientAvatar.x,
                  top: layout.recipientAvatar.y,
                  width: layout.recipientAvatar.width,
                  height: layout.recipientAvatar.height
                }}
              >
                <div className={`w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/20`}>
                  <img
                    src={recipient.avatar_url}
                    alt={recipient.display_name}
                    className="w-full h-full object-cover pointer-events-none opacity-80"
                  />
                </div>
                <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                  Recip. Avatar ({layout.recipientAvatar.width}px)
                </div>
              </div>
            )}

            {/* Recipient Username */}
            {recipientType === 'user' && (
              <div
                onMouseDown={(e) => handleMouseDown('recipientUsername', e)}
                className={`absolute cursor-move border-2 ${dragging === 'recipientUsername' || selected === 'recipientUsername' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-dashed border-white/30'} rounded-lg p-2 transition-all`}
                style={{
                  left: layout.recipientUsername.x,
                  top: layout.recipientUsername.y,
                  width: layout.recipientUsername.width,
                  height: layout.recipientUsername.height,
                  fontSize: layout.recipientUsername.fontSize,
                  textAlign: 'right'
                }}
              >
                <div className="text-white font-bold truncate leading-tight">{recipient.display_name}</div>
                <div
                  className="font-mono uppercase tracking-wider truncate"
                  style={{
                    fontSize: `${(layout.recipientUsername.fontSize || 10) * 0.7}px`,
                    color: getRoleColor(recipient.role || ''),
                    textShadow: `0 0 8px ${getRoleColor(recipient.role || '')}22`,
                    opacity: 0.8
                  }}
                >
                  {recipient.role || 'ROLE'}
                </div>
                <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                  Recip. Username ({layout.recipientUsername.fontSize}px)
                </div>
              </div>
            )}

            {/* Love Note Label */}
            <div
              onMouseDown={(e) => handleMouseDown('loveNote', e)}
              className={`absolute cursor-move border-2 ${dragging === 'loveNote' || selected === 'loveNote' ? 'border-mb-purple shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'border-dashed border-white/30'} rounded-lg p-2 transition-all`}
              style={{
                left: layout.loveNote.x,
                top: layout.loveNote.y,
                width: layout.loveNote.width,
                height: layout.loveNote.height,
                fontSize: layout.loveNote.fontSize
              }}
            >
              <div className="text-purple-300/70 font-bold uppercase tracking-wider">Love Note</div>
              <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                Label ({layout.loveNote.fontSize}px)
              </div>
            </div>

            {/* Message */}
            <div
              onMouseDown={(e) => handleMouseDown('message', e)}
              className={`absolute cursor-move border-2 ${dragging === 'message' || selected === 'message' ? 'border-mb-purple shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'border-dashed border-white/30'} rounded-lg p-3 transition-all bg-black/20`}
              style={{
                left: layout.message.x,
                top: layout.message.y,
                width: layout.message.width,
                height: layout.message.height,
                fontSize: layout.message.fontSize
              }}
            >
              <div className="text-white line-clamp-3">{message || 'Your message here...'}</div>
              <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                Message ({layout.message.width}×{layout.message.height}px, {layout.message.fontSize}px)
              </div>
            </div>

            {/* From → To */}
            <div
              onMouseDown={(e) => handleMouseDown('fromTo', e)}
              className={`absolute cursor-move border-2 ${dragging === 'fromTo' || selected === 'fromTo' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-dashed border-white/30'} rounded-lg p-2 transition-all`}
              style={{
                left: layout.fromTo.x,
                top: layout.fromTo.y,
                width: layout.fromTo.width,
                height: layout.fromTo.height,
                fontSize: layout.fromTo.fontSize
              }}
            >
              <div className="flex items-center gap-1 font-mono text-white/40">
                <span>from</span>
                <span className={`${rarity.accent} font-bold opacity-80`}>@{sender.username}</span>
                <span>→</span>
                <span className={`${rarity.accent} font-bold opacity-80`}>{recipientText}</span>
              </div>
              <div className="absolute -top-8 left-0 text-[10px] text-white/60 font-mono bg-black/60 px-2 py-1 rounded">
                From→To ({layout.fromTo.fontSize}px)
              </div>
            </div>
          </div>
        </HeartContainer>
      </div>

      {/* Coordinate Controls Panel */}
      <div className="w-80 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-h-[700px] overflow-y-auto">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <span className="text-mb-purple">●</span>
          Manual Position Control
        </h3>

        {selected ? (
          <div className="space-y-4">
            <div className="bg-mb-purple/10 border border-mb-purple/30 rounded-lg px-3 py-2">
              <div className="text-mb-purple text-xs font-bold uppercase tracking-wider">
                {elementNames[selected]}
              </div>
            </div>

            {/* X Coordinate */}
            <div>
              <label className="text-white/60 text-xs font-mono mb-1.5 block">X Position</label>
              <input
                type="number"
                value={Math.round(layout[selected as keyof LayoutConfig].x)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElementProperty(selected, 'x', Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-mb-purple/60 transition-all"
              />
            </div>

            {/* Y Coordinate */}
            <div>
              <label className="text-white/60 text-xs font-mono mb-1.5 block">Y Position</label>
              <input
                type="number"
                value={Math.round(layout[selected as keyof LayoutConfig].y)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElementProperty(selected, 'y', Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-mb-purple/60 transition-all"
              />
            </div>

            {/* Width */}
            <div>
              <label className="text-white/60 text-xs font-mono mb-1.5 block">Width</label>
              <input
                type="number"
                value={Math.round(layout[selected as keyof LayoutConfig].width)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElementProperty(selected, 'width', Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-mb-purple/60 transition-all"
              />
            </div>

            {/* Height */}
            <div>
              <label className="text-white/60 text-xs font-mono mb-1.5 block">Height</label>
              <input
                type="number"
                value={Math.round(layout[selected as keyof LayoutConfig].height)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElementProperty(selected, 'height', Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-mb-purple/60 transition-all"
              />
            </div>

            {/* Font Size (if applicable) */}
            {layout[selected as keyof LayoutConfig].fontSize !== undefined && (
              <div>
                <label className="text-white/60 text-xs font-mono mb-1.5 block">Font Size</label>
                <input
                  type="number"
                  value={Math.round(layout[selected as keyof LayoutConfig].fontSize!)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElementProperty(selected, 'fontSize', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-mb-purple/60 transition-all"
                />
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <div className="text-white/40 text-[10px] font-mono leading-relaxed">
                Tip: You can also drag elements directly on the canvas to reposition them
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-white/40 text-xs font-mono">
              Click on any element to edit its position
            </div>
          </div>
        )}

        {/* Quick Select Buttons */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-white/60 text-xs font-mono mb-3">Quick Select:</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(elementNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selected === key
                  ? 'bg-mb-purple/20 border border-mb-purple/60 text-mb-purple'
                  : 'bg-black/40 border border-white/10 text-white/60 hover:bg-black/60 hover:border-white/20'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValentineLayoutEditor;
