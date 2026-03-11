"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 160;

function genSpectrum(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const bass   = Math.exp(-((t - 0.10) ** 2) / 0.0060) * 0.60;
    const lowMid = Math.exp(-((t - 0.28) ** 2) / 0.0160) * 0.88;
    const mid    = Math.exp(-((t - 0.48) ** 2) / 0.0130) * 0.78;
    const hiMid  = Math.exp(-((t - 0.64) ** 2) / 0.0090) * 0.55;
    const air    = Math.exp(-((t - 0.80) ** 2) / 0.0050) * 0.32;
    const noise  = Math.abs(Math.sin(i * 2.13)) * 0.16 + Math.abs(Math.sin(i * 5.71 + 1.2)) * 0.09;
    return Math.min(1, Math.max(0.04, bass + lowMid + mid + hiMid + air + noise));
  });
}

const HEIGHTS = genSpectrum(BAR_COUNT);

export default function EqualizerDivider() {
  return (
    <div className="eq-divider" aria-hidden="true">
      <div className="waveform h-20">
        {HEIGHTS.map((h, i) => (
          <motion.div
            key={i}
            className="wave-bar"
            suppressHydrationWarning
            style={{
              height:  `${Math.max(3, Math.round(h * 72))}px`,
              opacity: 0.15 + h * 0.72,
            }}
            animate={{
              scaleY: [0.15, 1, 0.48, 0.86, 0.22, 0.64, 0.35, 0.15],
            }}
            transition={{
              duration: 1.8 + h * 1.4,
              repeat:   Infinity,
              ease:     "easeInOut",
              delay:    (i * 0.041) % 2.2,
              times:    [0, 0.12, 0.28, 0.45, 0.62, 0.78, 0.9, 1],
            }}
          />
        ))}
      </div>
    </div>
  );
}
