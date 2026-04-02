import { motion } from "framer-motion";
import { type PropsWithChildren } from "react";

export function StaggerGroup({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}
