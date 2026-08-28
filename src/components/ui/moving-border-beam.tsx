"use client";
import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

export const MovingBorderBeam = ({
  duration = 6000,
  borderWidth = 1.5,
  rx = 22,
  ry = 22,
  colorFrom = "hsl(var(--ai-gradient-start))",
  colorTo = "hsl(var(--ai-gradient-end))",
  beamSize = 160,
  className,
}: {
  duration?: number;
  borderWidth?: number;
  rx?: number | string;
  ry?: number | string;
  colorFrom?: string;
  colorTo?: string;
  beamSize?: number;
  className?: string;
}) => {
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
            background: `radial-gradient(circle, ${colorFrom} 10%, ${colorTo} 40%, transparent 70%)`
          }}
        />
      </motion.div>
    </div>
  );
};
