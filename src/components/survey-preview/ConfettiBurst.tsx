import * as React from "react";
import { createPortal } from "react-dom";

/**
 * A one-shot confetti burst, drawn to a canvas that covers the preview
 * drawer — not the whole screen — so the shower reads as this panel
 * celebrating, not the entire app. Skips entirely under
 * `prefers-reduced-motion` — nothing to reduce, so nothing to draw.
 *
 * Portaled to the drawer's own root (via `containerRef`) rather than
 * rendered inline: the closing page lives inside the drawer's scrollable
 * middle pane, and an inline `absolute` canvas there would only cover that
 * pane, clipped by its own scroll bounds, instead of the full drawer
 * (header through footer). Portaling to the drawer root and sizing off its
 * `clientWidth`/`clientHeight` — with the drawer's own `overflow-hidden`
 * doing the clipping — keeps the burst inside the panel without leaking
 * past its rounded corners.
 */

const PARTICLE_COUNT = 140;
const DURATION_MS = 3200;
const COLORS = [
  "oklch(68% 0.19 250)",
  "oklch(75% 0.18 200)",
  "oklch(80% 0.18 140)",
  "oklch(78% 0.19 80)",
  "oklch(70% 0.22 25)",
  "oklch(72% 0.2 330)",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  tilt: number;
}

function createParticles(width: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 3.2,
    vy: 2.5 + Math.random() * 3,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
    tilt: Math.random() * Math.PI * 2,
  }));
}

interface ConfettiBurstProps {
  /** The drawer's own root — the canvas portals here and sizes itself off
   * its bounds, so the burst is confined to the panel. */
  containerRef: React.RefObject<HTMLElement | null>;
}

export function ConfettiBurst({ containerRef }: ConfettiBurstProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // `containerRef.current` is still null on the first render — refs attach
  // during commit, after render runs — so the portal target is read back out
  // via state once mounted, instead of straight off the ref during render.
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setContainer(containerRef.current);
  }, [containerRef]);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const particles = createParticles(width);
    const startedAt = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const fadeStart = DURATION_MS - 600;
      const opacity = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 600) : 1;

      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.02;
        particle.rotation += particle.spin;
        particle.tilt += 0.05;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        const skew = Math.sin(particle.tilt);
        ctx.scale(1, skew * 0.6 + 0.4);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [container]);

  if (!container) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
    />,
    container
  );
}
