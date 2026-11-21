'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import BookScene, { type FlagRef, type NumberRef } from './Book';
import {
  allFaces,
  type Block,
  type Face,
  facesForSpread,
  SPREADS,
  socialLinks,
} from './content';
import { LEAF_COUNT } from './metrics';
import {
  type BookTextures,
  createBookTextures,
  disposeBookTextures,
} from './textures';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function blockKey(block: Block, seen: Map<string, number>) {
  const base = block.type === 'gap' ? 'gap' : `${block.type}-${block.text}`;
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return `${base}-${count}`;
}

function FaceCopy({ face }: { face: Face }) {
  const seen = new Map<string, number>();
  return (
    <article className="font-shippori">
      {face.blocks.map((block) => (
        <BlockCopy key={blockKey(block, seen)} block={block} />
      ))}
    </article>
  );
}

function BlockCopy({ block }: { block: Block }) {
  if (block.type === 'gap') return <div className="h-3" />;
  if (block.type === 'kicker') {
    return (
      <p className="text-xs tracking-[0.28em] text-[#3e6d58] uppercase">
        {block.text}
      </p>
    );
  }
  if (block.type === 'title') {
    return <h2 className="text-2xl font-bold">{block.text}</h2>;
  }
  if (block.type === 'heading') {
    const className = 'mt-3 border-b border-[#c4b49a] pb-1 font-bold';
    if (block.href) {
      return (
        <a
          className={`${className} block text-inherit`}
          href={block.href}
          target="_blank"
          rel="noreferrer"
        >
          {block.text}
        </a>
      );
    }
    return <h3 className={className}>{block.text}</h3>;
  }
  if (block.href) {
    return (
      <a
        className="block border-b border-[#d5c7b2] pb-1 text-inherit"
        href={block.href}
        target="_blank"
        rel="noreferrer"
      >
        {block.text}
      </a>
    );
  }
  return <p className="border-b border-[#d5c7b2] pb-1">{block.text}</p>;
}

function StaticPortfolio() {
  return (
    <main className="min-h-svh bg-[#d4aa6c] px-6 py-16 text-[#241f1a]">
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        {allFaces.map((face) => (
          <FaceCopy key={face.id} face={face} />
        ))}
      </div>
    </main>
  );
}

export default function BookExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const linkLayerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const reduceRef = useRef(false);
  const narrowRef = useRef(false);
  const hintOn = useRef(true);
  const [textures, setTextures] = useState<BookTextures | null>(null);
  const [failed, setFailed] = useState(false);
  const [spread, setSpread] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const width = window.matchMedia('(max-width: 800px)');
    const sync = () => {
      reduceRef.current = motion.matches;
      narrowRef.current = width.matches;
      setNarrow(width.matches);
    };
    sync();
    motion.addEventListener('change', sync);
    width.addEventListener('change', sync);
    return () => {
      motion.removeEventListener('change', sync);
      width.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let current: BookTextures | null = null;
    createBookTextures()
      .then((next) => {
        if (cancelled) {
          disposeBookTextures(next);
          return;
        }
        current = next;
        setTextures(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (current) disposeBookTextures(current);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      const max = root.offsetHeight - window.innerHeight;
      const traveled = window.scrollY - root.offsetTop;
      targetRef.current =
        max <= 1 ? 0 : clamp((traveled / max) * LEAF_COUNT, 0, LEAF_COUNT);
      if (hintOn.current && targetRef.current > 0.05) {
        hintOn.current = false;
        setShowHint(false);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToIndex = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const max = Math.max(0, root.offsetHeight - window.innerHeight);
    const top =
      root.offsetTop + (clamp(index, 0, LEAF_COUNT) / LEAF_COUNT) * max;
    window.scrollTo({
      top,
      behavior: reduceRef.current ? 'auto' : 'smooth',
    });
  };
  const scrollToRef = useRef(scrollToIndex);
  scrollToRef.current = scrollToIndex;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'A') return;
      const nextKey =
        event.key === 'ArrowDown' ||
        event.key === 'ArrowRight' ||
        event.key === 'PageDown' ||
        (event.key === ' ' && !event.shiftKey);
      const prevKey =
        event.key === 'ArrowUp' ||
        event.key === 'ArrowLeft' ||
        event.key === 'PageUp' ||
        (event.key === ' ' && event.shiftKey);
      if (!nextKey && !prevKey && event.key !== 'Home' && event.key !== 'End') {
        return;
      }
      event.preventDefault();
      if (event.key === 'Home') {
        scrollToRef.current(0);
        return;
      }
      if (event.key === 'End') {
        scrollToRef.current(LEAF_COUNT);
        return;
      }
      const current = targetRef.current;
      if (nextKey) {
        scrollToRef.current(
          Math.min(LEAF_COUNT, Math.floor(current + 0.001) + 1)
        );
        return;
      }
      scrollToRef.current(Math.max(0, Math.ceil(current - 0.001) - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (failed) return <StaticPortfolio />;

  const spreadFaces = facesForSpread(spread);

  return (
    <div
      ref={rootRef}
      className="bg-[#d4aa6c] text-[#241f1a]"
      style={{ height: `${(LEAF_COUNT + 1) * 100}svh` }}
    >
      <div className="sticky top-0 h-svh">
        <div className="pointer-events-none absolute inset-0">
          {textures ? (
            <Canvas
              orthographic
              className="h-full w-full touch-pan-y select-none"
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: false }}
              camera={{ position: [0, 12, 0], zoom: 220, near: 0.01, far: 40 }}
            >
              <BookScene
                textures={textures}
                targetRef={targetRef as NumberRef}
                reduceRef={reduceRef as FlagRef}
                narrowRef={narrowRef as FlagRef}
                linkLayerRef={linkLayerRef}
                onSpread={setSpread}
              />
            </Canvas>
          ) : null}
        </div>

        {textures ? (
          <div
            ref={linkLayerRef}
            className="pointer-events-none absolute inset-0 z-[15]"
          >
            {textures.workHits.map((hit) => (
              <a
                key={hit.href}
                href={hit.href}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto absolute hidden cursor-pointer hover:bg-[#c4a574]/35 focus-visible:bg-[#c4a574]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#241f1a]"
              >
                <span className="sr-only">{hit.label}</span>
              </a>
            ))}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(70,40,16,0.24)_100%)]" />

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-8">
          <p className="pointer-events-auto text-sm tracking-[0.42em]">rii</p>
          <nav className="pointer-events-auto flex gap-5 text-sm">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[#9a7040] underline-offset-4"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <button
          type="button"
          aria-label="前のページ"
          className="absolute top-16 left-0 z-10 h-[34%] w-[18%] cursor-w-resize md:bottom-20 md:h-auto md:w-[12%]"
          onClick={() =>
            scrollToIndex(Math.max(0, Math.ceil(targetRef.current - 0.001) - 1))
          }
        />
        <button
          type="button"
          aria-label="次のページ"
          className="absolute top-16 right-0 z-10 h-[34%] w-[18%] cursor-e-resize md:bottom-20 md:h-auto md:w-[12%]"
          onClick={() =>
            scrollToIndex(
              Math.min(LEAF_COUNT, Math.floor(targetRef.current + 0.001) + 1)
            )
          }
        />

        {showHint ? (
          <p className="pointer-events-none absolute top-14 left-1/2 z-20 -translate-x-1/2 text-center text-sm tracking-[0.28em] max-[800px]:top-[46%]">
            スクロールで開く
            <span className="mt-1 block">↓</span>
          </p>
        ) : null}

        {narrow ? (
          <div className="absolute inset-x-3 bottom-14 z-20 max-h-[40svh] overflow-y-auto bg-[#f7f2e8]/95 px-4 py-3 shadow-[0_10px_30px_rgba(48,28,12,0.18)]">
            <div className="flex flex-col gap-4">
              {spreadFaces.map((face) => (
                <FaceCopy key={face.id} face={face} />
              ))}
            </div>
          </div>
        ) : null}

        <nav className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-4 px-3 text-xs tracking-[0.14em] md:gap-6 md:text-sm">
          {SPREADS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={
                index === spread
                  ? 'border-b border-[#241f1a] pb-0.5'
                  : 'opacity-55'
              }
              aria-current={index === spread ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sr-only">
          {allFaces.map((face) => (
            <FaceCopy key={face.id} face={face} />
          ))}
        </div>
      </div>
    </div>
  );
}
