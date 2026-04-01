import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

type StaggerGroupProps = PropsWithChildren<{
  delay?: number;
  stagger?: number;
  className?: string;
}>;

export function StaggerGroup({ children, delay = 0, stagger = 0.06, className }: StaggerGroupProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
      }}
    >
      {children}
    </motion.div>
  );
}
