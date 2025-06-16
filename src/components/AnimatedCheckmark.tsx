"use client";

import { motion } from 'framer-motion';

const AnimatedCheckmark = ({ size = 80 }: { size?: number }) => {
  const icon = {
    hidden: {
      pathLength: 0,
      fill: "rgba(255, 255, 255, 0)"
    },
    visible: {
      pathLength: 1,
      fill: "rgba(hsl(var(--primary-foreground)), 1)" // Use primary-foreground for checkmark color
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
        className="rounded-full bg-primary p-2 shadow-lg"
        style={{ width: '100%', height: '100%' }}
        aria-label="Order success checkmark"
      >
        <motion.path
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          fill="none"
          strokeWidth="4"
          stroke="hsl(var(--primary-foreground))" // primary-foreground color
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={icon}
          initial="hidden"
          animate="visible"
          transition={{
            default: { duration: 0.5, ease: "easeInOut" },
            fill: { duration: 0.5, ease: [1, 0, 0.8, 1], delay: 0.3 }
          }}
        />
      </svg>
    </div>
  );
};

export default AnimatedCheckmark;
