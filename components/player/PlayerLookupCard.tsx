import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, UserX } from 'lucide-react';

interface PlayerLookupCardProps {
  onFind: (input: string) => Promise<void>;
}

type LookupState = 'idle' | 'loading' | 'found' | 'notFound' | 'error';

const PlayerLookupCard: React.FC<PlayerLookupCardProps> = ({ onFind }) => {
  const [input, setInput] = useState('');
  const [state, setState] = useState<LookupState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setState('loading');
    setErrorMessage('');

    try {
      await onFind(input.trim());
      setState('found');
    } catch (error) {
      if (error instanceof Error && error.message === 'Player not found') {
        setState('notFound');
      } else {
        setState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to find player');
      }
    }
  };

  const handleReset = () => {
    setInput('');
    setState('idle');
    setErrorMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-md p-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] max-w-[1400px] mx-auto"
    >
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />

      <div className="relative z-10">
        <h3 className="text-xs font-mono uppercase tracking-[0.4em] text-white/40 mb-6 text-center">
          Enter Twitter or Discord username
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/[0.07] border border-white/20 rounded-full group-focus-within:bg-white/[0.12] group-focus-within:border-mb-purple/60 group-hover:border-white/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-mb-purple transition-colors z-10" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@username or <@123...>"
              disabled={state === 'loading'}
              className="relative block w-full pl-20 pr-8 py-3 bg-transparent focus:outline-none transition-all text-white text-sm font-mono tracking-wider uppercase placeholder:text-white/25 pointer-events-auto"
            />
            <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-mb-purple/0 group-focus-within:bg-mb-purple/80 transition-all duration-500 scale-x-0 group-focus-within:scale-x-100 origin-center" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="submit"
              disabled={state === 'loading' || !input.trim()}
              className="relative px-8 py-3 rounded-full bg-white/[0.07] border border-white/20 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-white/[0.12] hover:border-mb-purple/60 hover:text-mb-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/[0.07] disabled:hover:border-white/20 disabled:hover:text-white disabled:hover:shadow-none pointer-events-auto backdrop-blur-md"
            >
              {state === 'loading' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding...
                </span>
              ) : (
                'Find'
              )}
            </button>

            {state !== 'idle' && state !== 'loading' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors pointer-events-auto"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default PlayerLookupCard;
