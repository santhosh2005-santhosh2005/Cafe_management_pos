import { useEffect, useState } from "react";
import { motion, useSpring } from "motion/react";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // High-performance springs for the cursor
  // Increased stiffness and decreased damping for less delay
  const dotX = useSpring(0, { damping: 50, stiffness: 1000 });
  const dotY = useSpring(0, { damping: 50, stiffness: 1000 });
  
  const circleX = useSpring(0, { damping: 30, stiffness: 450 });
  const circleY = useSpring(0, { damping: 30, stiffness: 450 });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("custom-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      dotX.set(e.clientX - 7);
      dotY.set(e.clientY - 7);
      
      circleX.set(e.clientX - 19);
      circleY.set(e.clientY - 19);
      
      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = (e: MouseEvent) => {
       const target = e.target as HTMLElement;
       const isInteractive = target.closest('button, a, input, select, textarea, .card, [role="button"]');
       setIsHovering(!!isInteractive);
    };

    const onMouseLeaveDoc = () => setIsVisible(false);
    const onMouseEnterDoc = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseEnter);
    document.addEventListener("mouseleave", onMouseLeaveDoc);
    document.addEventListener("mouseenter", onMouseEnterDoc);
    
    return () => {
      root.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeaveDoc);
      document.removeEventListener("mouseenter", onMouseEnterDoc);
    };
  }, [dotX, dotY, circleX, circleY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100000] overflow-hidden">
      {/* Lagging Circle */}
      <motion.div
        style={{ x: circleX, y: circleY }}
        className="w-[38px] h-[38px] border-[1.5px] border-[var(--forest)] rounded-full fixed"
        animate={{
           scale: isHovering ? 1.6 : 1,
           borderColor: isHovering ? "var(--yellow)" : "var(--forest)",
           opacity: isHovering ? 0.8 : 0.4
        }}
      />

      {/* Main Dot */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        className="w-[14px] h-[14px] bg-[var(--forest)] rounded-full fixed"
        animate={{
           scale: isHovering ? 0.6 : 1,
           backgroundColor: isHovering ? "var(--yellow)" : "var(--forest)"
        }}
      />
    </div>
  );
}
