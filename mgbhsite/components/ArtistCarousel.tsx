
import React, { useEffect, useRef, useState } from 'react';
import { User } from '@/types';
import { fetchCarouselUsers } from '@/services/dataService';

const SPAWN_INTERVAL = 1500;
const DAMPING = 0.04;
const HOVER_FORCE = 0.4;
const COLLISION_MARGIN = 30;
const REPULSION_RADIUS = 150;
const REPULSION_STRENGTH = 0.12;

const SIZE_MIN = 85;
const SIZE_MAX = 105;
const SPEED_MIN = 0.45;
const SPEED_MAX = 0.85;

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
  baseVx: number;
  currentVx: number;
  size: number;
  src: string;
  username: string;
  element: HTMLDivElement | null;
}

const ArtistCarousel: React.FC<{ containerHeight: number; fadeProgress: number }> = ({ containerHeight, fadeProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Card[]>([]);
  const [renderedCards, setRenderedCards] = useState<Card[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const requestRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const mouseXRef = useRef(window.innerWidth / 2);
  const cycleQueueRef = useRef<User[]>([]);
  const lastLaneRef = useRef(0);

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
    const handleMouseMove = (e: MouseEvent) => { mouseXRef.current = e.clientX; };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (users.length === 0) return;

    const spawnCard = () => {
      const w = window.innerWidth;

      // 1. Manage cycle queue
      if (cycleQueueRef.current.length === 0) {
        cycleQueueRef.current = shuffleArray(users);
      }

      // 2. Find next user in cycle that isn't currently on screen
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

      // 3. Lane and direction
      const lane = lastLaneRef.current === 0 ? 1 : 0;
      lastLaneRef.current = lane;
      const direction = lane === 0 ? 1 : -1;

      // 4. Size and speed mapping (Smaller = Faster)
      const size = Math.floor(Math.random() * (SIZE_MAX - SIZE_MIN)) + SIZE_MIN;
      const speedMagnitude = SPEED_MAX - ((size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)) * (SPEED_MAX - SPEED_MIN);
      const baseVx = speedMagnitude * direction;

      const y = lane === 0 ? 5 : (containerHeight / 2) + 5;
      const spawnX = direction > 0 ? -size - 50 : w + 50;

      const newCard: Card = {
        id: nextIdRef.current++,
        lane,
        direction,
        x: spawnX,
        y,
        baseVx,
        currentVx: baseVx,
        size,
        src: user.avatar_url,
        username: user.username,
        element: null
      };

      cardsRef.current.push(newCard);
      setRenderedCards([...cardsRef.current]);
    };

    const interval = setInterval(spawnCard, SPAWN_INTERVAL);
    const initialTimeout = setTimeout(spawnCard, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [containerHeight, users]);

  useEffect(() => {
    const animate = () => {
      const cards = cardsRef.current;
      const w = window.innerWidth;
      const mouseX = mouseXRef.current;
      const strength = strengthRef.current;

      cards.forEach(card => {
        let targetVx = card.baseVx;

        if (hoveredId === card.id) {
          const slowDownFactor = 1 - (0.85 * strength);
          targetVx = card.baseVx * slowDownFactor;
        } else {
          const dx = (card.x + card.size / 2) - mouseX;
          const dist = Math.abs(dx);
          if (dist < 350) {
            const pushBase = (1 - dist / 350) * HOVER_FORCE;
            const push = pushBase * strength;
            targetVx += dx > 0 ? push : -push;
          }
        }

        cards.forEach(other => {
          if (card.id === other.id || card.lane !== other.lane || card.direction !== other.direction) return;

          const dx = card.x - other.x;
          const dist = Math.abs(dx);

          if (dist < REPULSION_RADIUS) {
            const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH * strength;
            if (dx > 0) card.currentVx += force;
            else card.currentVx -= force;
          }
        });

        card.currentVx += (targetVx - card.currentVx) * DAMPING;
      });

      [0, 1].forEach(lane => {
        const dir = lane === 0 ? 1 : -1;
        const group = cards.filter(c => c.lane === lane);
        group.sort((a, b) => dir === 1 ? b.x - a.x : a.x - b.x);

        for (let i = 1; i < group.length; i++) {
          const front = group[i - 1];
          const back = group[i];
          const gap = dir === 1
            ? front.x - (back.x + back.size)
            : back.x - (front.x + front.size);

          if (gap < COLLISION_MARGIN) {
            if (dir === 1) back.x = front.x - back.size - COLLISION_MARGIN;
            else back.x = front.x + front.size + COLLISION_MARGIN;

            const relVel = (back.currentVx * dir) - (front.currentVx * dir);
            if (relVel > 0) {
              front.currentVx += dir * relVel * 0.4;
              back.currentVx -= dir * relVel * 0.4;
            } else {
              back.currentVx = front.currentVx;
            }
          }
        }
      });

      let needsCleanup = false;
      const buffer = 100;

      cards.forEach(card => {
        card.x += card.currentVx;
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
  }, [hoveredId, renderedCards]);

  const strength = 1 - fadeProgress;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-visible pointer-events-none">
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
  );
};

export default ArtistCarousel;
