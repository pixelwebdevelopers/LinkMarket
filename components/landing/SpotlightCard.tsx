"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Enable subtle 3D tilt toward the cursor */
  tilt?: boolean;
  /** Max tilt in degrees */
  maxTilt?: number;
}

export function SpotlightCard({ children, className, tilt = false, maxTilt = 6 }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (tilt) {
      el.style.setProperty("--ry", `${(px - 0.5) * 2 * maxTilt}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * 2 * maxTilt}deg`);
    }
  }

  function handleLeave() {
    const el = ref.current;
    if (!el || !tilt) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn("spotlight", tilt && "tilt", className)}
    >
      {children}
    </div>
  );
}
