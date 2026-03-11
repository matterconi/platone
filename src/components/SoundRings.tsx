"use client";

import { motion } from "framer-motion";

export default function SoundRings() {
  return (
    <div className="sound-rings-wrap" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${i === 0 ? "rgba(184,255,0,0.24)" : "rgba(184,255,0,0.16)"}`,
          }}
          animate={{
            scale:   [0.08, 0.08, 1,    1   ],
            opacity: [0,    0.9,  0.25, 0   ],
          }}
          transition={{
            duration: 2.8,
            repeat:   Infinity,
            ease:     "easeOut",
            delay:    i * 0.46,
            times:    [0, 0.08, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}
