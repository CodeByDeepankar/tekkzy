"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";

const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, label, [role='button'], .service-card, .message-card, .chatbot-fab";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(-120);
  const pointerY = useMotionValue(-120);

  const cursorX = useSpring(pointerX, { stiffness: 640, damping: 44, mass: 0.32 });
  const cursorY = useSpring(pointerY, { stiffness: 640, damping: 44, mass: 0.32 });

  const glowX = useSpring(pointerX, { stiffness: 240, damping: 34, mass: 0.7 });
  const glowY = useSpring(pointerY, { stiffness: 240, damping: 34, mass: 0.7 });

  useEffect(() => {
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) {
      return;
    }

    let interactiveActive = false;
    let hasMoved = false;
    document.body.classList.add("has-custom-cursor");

    const setInteractiveState = (active: boolean) => {
      if (!cursorRef.current || !glowRef.current) {
        return;
      }

      gsap.to(cursorRef.current, {
        scale: active ? 1.2 : 1,
        rotation: active ? -7 : 0,
        duration: 0.22,
        ease: "power3.out",
      });

      gsap.to(glowRef.current, {
        scale: active ? 1.75 : 1,
        opacity: active ? 0.56 : 0.32,
        duration: 0.24,
        ease: "power3.out",
      });
    };

    const hideCursor = () => {
      if (!cursorRef.current || !glowRef.current) {
        return;
      }

      gsap.to([cursorRef.current, glowRef.current], {
        autoAlpha: 0,
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const showCursor = () => {
      if (!cursorRef.current || !glowRef.current) {
        return;
      }

      gsap.to([cursorRef.current, glowRef.current], {
        autoAlpha: 1,
        duration: 0.22,
        ease: "power2.out",
      });
    };

    const handleMove = (event: MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);

      if (!hasMoved) {
        hasMoved = true;
        showCursor();
      }

      const target = event.target as HTMLElement | null;
      const isInteractive = Boolean(target?.closest(INTERACTIVE_SELECTOR));

      if (interactiveActive !== isInteractive) {
        interactiveActive = isInteractive;
        setInteractiveState(isInteractive);
      }
    };

    const handleMouseDown = () => {
      if (!cursorRef.current) {
        return;
      }

      gsap.to(cursorRef.current, {
        scale: interactiveActive ? 1 : 0.86,
        duration: 0.12,
        ease: "power2.out",
      });
    };

    const handleMouseUp = () => {
      if (!cursorRef.current) {
        return;
      }

      gsap.to(cursorRef.current, {
        scale: interactiveActive ? 1.2 : 1,
        duration: 0.16,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", hideCursor);
    document.addEventListener("mouseenter", showCursor);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", hideCursor);
      document.removeEventListener("mouseenter", showCursor);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [glowX, glowY, pointerX, pointerY]);

  return (
    <>
      <motion.div
        ref={glowRef}
        className="custom-cursor-glow"
        style={{ left: glowX, top: glowY, pointerEvents: "none" }}
        aria-hidden="true"
      />
      <motion.div
        ref={cursorRef}
        className="custom-cursor"
        style={{ left: cursorX, top: cursorY, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </>
  );
}
