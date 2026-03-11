"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
  hidden:  { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)" },
};

export default function FadeInView({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
