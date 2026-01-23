
import React, { useEffect, useRef, useState } from 'react';
import { User } from '@/types';
import { fetchCarouselUsers } from '@/services/dataService';

const SPAWN_INTERVAL = 3000;
const BASE_SPEED = 0.45;
const SIZE_MIN = 85;
const SIZE_MAX = 105;

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface Card {
  id: number;
  lane: number;
  direction: number;
  x: number;
  y: number;
  vx: number;
  size: number;
  src: string;
  username: string;
  element: HTMLDivElement | null;
}

const MobileCarousel: React.FC<{ users: User[] }> = ({ users }) => {
  const mobileAvatars = users.slice(0, 20);
  if (mobileAvatars.length === 0) return null;

  // Double items for seamless loop
  const duplicated = [...mobileAvatars, ...mobileAvatars];

  return (
    <div className="md:hidden w-full h-full overflow-hidden flex flex-col justify-center gap-6 py-4 pointer-events-none select-none">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 50s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 50s linear infinite;
        }
      `}} />

      {/* Row 1: Left to Right */}
      <div className="relative flex whitespace-nowrap overflow-hidden">
        <div className="flex animate-scroll-right gap-4 px-2">
          {duplicated.map((user, i) => (
            <div key={`m1-${i}`} className="w-[70px] h-[70px] rounded-2xl border border-white/10 bg-white/5 opacity-70 overflow-hidden shrink-0 shadow-lg">
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover grayscale-[0.4] brightness-[0.8]" />
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div className="relative flex whitespace-nowrap overflow-hidden">
        <div className="flex animate-scroll-left gap-4 px-2">
          {duplicated.map((user, i) => (
            <div key={`m2-${i}`} className="w-[70px] h-[70px] rounded-2xl border border-white/10 bg-white/5 opacity-70 overflow-hidden shrink-0 shadow-lg">
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover grayscale-[0.4] brightness-[0.8]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArtistCarousel: React.FC<{ containerHeight: number; fadeProgress: number }> = ({ containerHeight, fadeProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Card[]>([]);
  const [renderedCards, setRenderedCards] = useState<Card[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const requestRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const cycleQueueRef = useRef<User[]>([]);
  const lastLaneRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnLockRef = useRef(false);

  const strengthRef = useRef(1 - fadeProgress);
  useEffect(() => {
    strengthRef.current = 1 - fadeProgress;
  }, [fadeProgress]);

  // Fetch live users on mount
  useEffect(() => {
    const loadUsers = async () => {
      const data = await fetchCarouselUsers();
      setUsers(data);
    };
    loadUsers();
  }, []);

  useEffect(() => {
    // Only run card spawner on desktop
    if (users.length === 0 || window.innerWidth <= 768) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const spawnCard = () => {
      // 1. Spawn Lock
      if (spawnLockRef.current) return;
      spawnLockRef.current = true;

      console.log('SPAWN');

      const w = window.innerWidth;

      // 2. Manage cycle queue
      if (cycleQueueRef.current.length === 0) {
        cycleQueueRef.current = shuffleArray(users);
      }

      // 3. Find next user in cycle that isn't currently on screen
      const currentOnScreen = new Set(cardsRef.current.map(c => c.username));
      let userIndex = -1;
      for (let i = 0; i < cycleQueueRef.current.length; i++) {
        if (!currentOnScreen.has(cycleQueueRef.current[i].username)) {
          userIndex = i;
          break;
        }
      }

      // If everyone in queue is on screen (small dataset), just take the first one
      if (userIndex === -1) userIndex = 0;
      const user = cycleQueueRef.current.splice(userIndex, 1)[0];

      // 4. Lane and direction
      const lane = lastLaneRef.current === 0 ? 1 : 0;
      lastLaneRef.current = lane;
      const direction = lane === 0 ? 1 : -1;

      // 5. Fixed Speed
      const size = Math.floor(Math.random() * (SIZE_MAX - SIZE_MIN)) + SIZE_MIN;
      const currentVx = BASE_SPEED * direction;

      const y = lane === 0 ? 5 : (containerHeight / 2) + 5;
      const spawnX = direction > 0 ? -size - 50 : w + 50;

      const newCard: Card = {
        id: nextIdRef.current++,
        lane,
        direction,
        x: spawnX,
        y,
        vx: currentVx,
        size,
        src: user.avatar_url,
        username: user.username,
        element: null
      };

      cardsRef.current.push(newCard);
      setRenderedCards([...cardsRef.current]);

      // Release lock on next frame
      requestAnimationFrame(() => {
        spawnLockRef.current = false;
      });
    };

    intervalRef.current = setInterval(spawnCard, SPAWN_INTERVAL);

    // Initial spawn
    const initialTimeout = setTimeout(spawnCard, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, [containerHeight, users]);

  useEffect(() => {
    // Only run animation loop on desktop
    if (window.innerWidth <= 768) return;

    const animate = () => {
      const cards = cardsRef.current;
      const w = window.innerWidth;

      let needsCleanup = false;
      const buffer = 100;

      cards.forEach(card => {
        card.x += card.vx;
        if (card.element) {
          card.element.style.transform = `translate3d(${card.x}px, ${card.y}px, 0)`;
        }

        if (card.direction > 0 && card.x > w + buffer) needsCleanup = true;
        else if (card.direction < 0 && card.x < -card.size - buffer) needsCleanup = true;
      });

      if (needsCleanup) {
        cardsRef.current = cards.filter(c => {
          if (c.direction > 0) return c.x <= w + buffer;
          return c.x >= -c.size - buffer;
        });
        setRenderedCards([...cardsRef.current]);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [renderedCards]);

  const strength = 1 - fadeProgress;

  return (
    <>
      <MobileCarousel users={users} />

      <div ref={containerRef} className="hidden md:block w-full h-full relative overflow-visible pointer-events-none">
        {renderedCards.map(card => (
          <div
            key={card.id}
            ref={el => { card.element = el; }}
            className="absolute top-0 left-0 will-change-transform"
            style={{
              width: card.size,
              height: card.size,
              zIndex: hoveredId === card.id ? 1000 : (card.lane === 0 ? 10 : 20),
              pointerEvents: strength > 0.1 ? 'auto' : 'none'
            }}
            onMouseEnter={() => setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <a
              href={`https://x.com/${card.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full p-2 cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
              style={{
                transform: (hoveredId === card.id && strength > 0.2)
                  ? `scale(${1 + (0.35 * strength)})`
                  : 'scale(1)'
              }}
            >
              <div className={`
                w-full h-full relative overflow-hidden rounded-2xl border transition-all duration-500
                ${hoveredId === card.id && strength > 0.2
                  ? 'border-mb-purple shadow-[0_0_50px_rgba(139,92,246,0.6)] bg-black opacity-100'
                  : 'border-white/5 bg-white/5 backdrop-blur-[1px] opacity-80'
                }
              `}>
                <img
                  src={card.src}
                  alt="Entity Impact"
                  className={`
                    w-full h-full object-cover transition-all duration-500
                    ${hoveredId === card.id && strength > 0.2
                      ? 'grayscale-0 opacity-100 contrast-125 brightness-110 scale-110'
                      : 'grayscale-[0.4] opacity-50 contrast-[0.8] brightness-[0.7]'
                    }
                  `}
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-mb-purple/40 via-transparent to-transparent transition-opacity duration-500"
                  style={{ opacity: (hoveredId === card.id && strength > 0.2) ? 1 : 0 }}
                />

                {hoveredId === card.id && strength > 0.2 && (
                  <div className="absolute inset-0 bg-white/10 h-px w-full -translate-y-full animate-[streak_2s_linear_infinite] opacity-30 pointer-events-none" />
                )}
              </div>
            </a>
          </div>
        ))}
      </div>
    </>
  );
};

export default ArtistCarousel;
