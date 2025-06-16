import { motion } from "framer-motion";
import { ReactNode } from "react";

// Animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6 }
  }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6 }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6 }
  }
};

// Animated components
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeIn}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const FadeInUp = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInUp}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const FadeInDown = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInDown}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const FadeInLeft = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInLeft}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const FadeInRight = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInRight}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const StaggerChildren = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, className = "", delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={scaleIn}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

// Hover animations
export const HoverScale = ({ children, className = "" }: AnimatedProps) => (
  <motion.div
    className={className}
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    {children}
  </motion.div>
);

export const HoverElevate = ({ children, className = "" }: AnimatedProps) => (
  <motion.div
    className={className}
    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    {children}
  </motion.div>
);

// Scroll progress animation
export const ScrollProgress = () => (
  <motion.div
    className="fixed top-0 left-0 right-0 h-1 bg-highlight z-50"
    style={{ scaleX: 0, transformOrigin: "0%" }}
    animate={{ scaleX: 1 }}
  />
);
