import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, index = 0, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.04, 0.3),
        ease: "easeOut",
      }}
      whileTap={{ scale: 0.97 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
