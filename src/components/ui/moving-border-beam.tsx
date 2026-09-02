"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* Two ways to draw the travelling accent:

   "glow" — a radial blob slid along the perimeter and clipped to the border
     ring. Reads as a soft comet on shapes whose width and height are close to
     the blob size (the 40px icon buttons in the action rails).

   "line" — a dash segment travelling along the rounded-rect path itself. On a
     wide, short pill the blob overlaps the top and bottom edges at once and
     looks like the beam split in two; a dash can only ever be in one place, so
     it stays a single line no matter the aspect ratio. */
type BeamMode = "glow" | "line";

export const MovingBorderBeam = ({
  duration = 6000,
  borderWidth = 1.5,
  rx = 22,
  ry = 22,
  colorFrom = "hsl(var(--ai-gradient-start))",
  colorTo = "hsl(var(--ai-gradient-end))",
  beamSize = 160,
  mode = "glow",
  className,
}: {
  duration?: number;
  borderWidth?: number;
  rx?: number | string;
  ry?: number | string;
  colorFrom?: string;
  colorTo?: string;
  beamSize?: number;
  mode?: BeamMode;
  className?: string;
}) => {
  if (mode === "line") {
    return (
      <LineBeam
        duration={duration}
        borderWidth={borderWidth}
        rx={rx}
        ry={ry}
        colorFrom={colorFrom}
        colorTo={colorTo}
        className={className}
      />
    );
  }

  return (
    <GlowBeam
      duration={duration}
      borderWidth={borderWidth}
      rx={rx}
      ry={ry}
      colorFrom={colorFrom}
      colorTo={colorTo}
      beamSize={beamSize}
      className={className}
    />
  );
};

type BeamProps = {
  duration: number;
  borderWidth: number;
  rx: number | string;
  ry: number | string;
  colorFrom: string;
  colorTo: string;
  /* Only the glow blob is sized in pixels; the line beam is a share of the
     perimeter, so it does not take this. */
  beamSize?: number;
  className?: string;
};

const GlowBeam = ({
  duration,
  borderWidth,
  rx,
  ry,
  colorFrom,
  colorTo,
  beamSize = 160,
  className,
}: BeamProps) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x ?? 0
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y ?? 0
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className
      )}
      style={{
        WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        padding: `calc(${borderWidth} * 1px)`,
      } as React.CSSProperties}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        <div 
          className="opacity-[0.9]"
          style={{
            width: beamSize,
            height: beamSize,
            background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
            WebkitMaskImage: "radial-gradient(circle, black 10%, black 40%, transparent 70%)",
            maskImage: "radial-gradient(circle, black 10%, black 40%, transparent 70%)"
          }}
        />
      </motion.div>
    </div>
  );
};

/* Just the light, no border. Like the icon buttons in the action rails, the
   shape has no visible outline of its own — only a beam travelling round where
   the border would be.

   The beam is a dash on the rounded-rect path rather than a radial blob, so on
   a wide, short pill it stays one light instead of lighting the top and bottom
   edges at once.

   It fades out along its length, not across its width: concentric dashes of the
   same stroke width, each shorter and more opaque than the last, all centred on
   the same point. That keeps the line crisp and evenly thick — blurring it
   instead turns the beam into a smudge of glow.

   Lengths are a share of the perimeter (pathLength normalises the path to 100
   units), so the beam keeps its proportions at any size and nothing needs
   measuring. */
const BEAM_LENGTH = 30; // share of the perimeter the beam spans
const TAIL_SHARE = 0.24; // fraction of the beam spent ramping up behind it
const HEAD_SHARE = 0.12; // …and ramping down in front
const RAMP_STEPS = 18;
const SEGMENT_OVERLAP = 0.06; // closes the hairline seam between segments

const smoothstep = (x: number) => x * x * (3 - 2 * x);

/* The beam is laid out as consecutive segments along the path — never as
   concentric dashes stacked on top of each other. Stacked translucent strokes
   composite their antialiased edge pixels over and over, so the line renders
   thicker where many layers overlap and appears to pulse as it travels. End to
   end, every part of the beam is exactly one stroke, so the thickness holds.

   Most of that length is a single solid segment. A long opacity fade reads as
   the line going *thin* rather than dim — a 2px stroke at 20% opacity simply
   looks thinner than the same stroke at full strength — so the fade is confined
   to short ramps at the two ends, and the body stays fully opaque. */
const BEAM_SEGMENTS = (() => {
  const segments: { lead: number; length: number; opacity: number }[] = [];
  const tail = BEAM_LENGTH * TAIL_SHARE;
  const head = BEAM_LENGTH * HEAD_SHARE;
  const body = BEAM_LENGTH - tail - head;

  const tailStep = tail / RAMP_STEPS;
  for (let i = 0; i < RAMP_STEPS; i += 1) {
    segments.push({
      lead: i * tailStep,
      length: tailStep + SEGMENT_OVERLAP,
      opacity: smoothstep((i + 1) / RAMP_STEPS),
    });
  }

  segments.push({ lead: tail, length: body + SEGMENT_OVERLAP, opacity: 1 });

  const headStep = head / RAMP_STEPS;
  for (let i = 0; i < RAMP_STEPS; i += 1) {
    segments.push({
      lead: tail + body + i * headStep,
      length: headStep + SEGMENT_OVERLAP,
      opacity: smoothstep(1 - (i + 1) / RAMP_STEPS),
    });
  }

  return segments;
})();

/* A stroke only renders crisp when it lands on the device's pixel grid. This
   button is 121.31px wide, so its vertical edges fall between pixel columns and
   rasterise as 0.69 / 1.00 / 0.31 across three columns, while the horizontal
   ones land on 1.00 / 1.00 — same ink, but the sides look soft and read as a
   thinner line as the beam travels round. Snapping the box to whole device
   pixels puts every side on the same footing. */
const usePixelSnappedBox = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ dx: 0, dy: 0, width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = element.getBoundingClientRect();
      const snap = (value: number) => Math.round(value * dpr) / dpr;

      const left = snap(rect.left);
      const top = snap(rect.top);

      setBox({
        dx: left - rect.left,
        dy: top - rect.top,
        width: snap(rect.right) - left,
        height: snap(rect.bottom) - top,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return [ref, box] as const;
};

const LineBeam = ({
  duration,
  borderWidth,
  rx,
  ry,
  colorFrom,
  colorTo,
  className,
}: BeamProps) => {
  const rawId = useId();
  const gradientId = `beam-gradient-${rawId}`;
  const offset = useMotionValue(0);
  const [boxRef, box] = usePixelSnappedBox();

  useAnimationFrame((time) => {
    offset.set(-((time / duration) % 1) * 100);
  });

  /* The svg box is inset by half the stroke so the stroke's centreline lands
     exactly where a real border would sit; the radii come in to match. */
  const inset = borderWidth / 2;
  const radiusX = typeof rx === "number" ? Math.max(rx - inset, 0) : rx;
  const radiusY = typeof ry === "number" ? Math.max(ry - inset, 0) : ry;

  const sharedRectProps = {
    width: box.width,
    height: box.height,
    rx: radiusX,
    ry: radiusY,
    fill: "none",
    stroke: `url(#${gradientId})`,
    strokeWidth: borderWidth,
    /* Butt caps: round ones stick half a stroke past each segment's end, so
       the segments would overlap into bumps along the fade. */
    strokeLinecap: "butt",
    pathLength: 100,
  } as const;

  return (
    /* The inset lives on this div, not on the svg — an svg is a replaced
       element, so insets alone leave it at its intrinsic 300x150. */
    <div
      ref={boxRef}
      className={cn("pointer-events-none absolute rounded-[inherit]", className)}
      style={{ top: inset, right: inset, bottom: inset, left: inset }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-0 top-0 overflow-visible"
        width={box.width}
        height={box.height}
        style={{ transform: `translate(${box.dx}px, ${box.dy}px)` }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colorFrom }} />
            <stop offset="100%" style={{ stopColor: colorTo }} />
          </linearGradient>
        </defs>

        {/* The leading gap places each segment along the beam, so all of them
            share a single offset instead of one motion value each. */}
        {box.width > 0 && BEAM_SEGMENTS.map(({ lead, length, opacity }) => (
          <motion.rect
            key={lead}
            {...sharedRectProps}
            opacity={opacity}
            strokeDasharray={`0 ${lead} ${length} ${100 - length - lead}`}
            style={{ strokeDashoffset: offset }}
          />
        ))}
      </svg>
    </div>
  );
};
