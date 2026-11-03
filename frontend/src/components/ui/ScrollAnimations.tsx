"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface AnimatedCountProps {
  value: number;
  duration?: number; // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  className?: string;
  startFromZero?: boolean;
}

/**
 * AnimatedCount counts up smoothly to target value
 * when the element is first scrolled into view.
 * Defaults to displaying the real value immediately so it never flashes 0/Rp 0.
 */
export function AnimatedCount({
  value,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  formatter,
  className = "",
  startFromZero = false,
}: AnimatedCountProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const elementRef = useRef<HTMLSpanElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const isIntersectingRef = useRef<boolean>(false);
  const currentValRef = useRef<number>(value);

  // Keep track of current displayed value
  useEffect(() => {
    currentValRef.current = displayValue;
  }, [displayValue]);

  const startAnimation = useCallback((startVal: number, endVal: number) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          isIntersectingRef.current = true;
          observer.disconnect();
          const startVal = startFromZero ? 0 : Math.round(value * 0.6);
          startAnimation(startVal, value);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [value, startFromZero, startAnimation]);

  // When value prop updates (e.g. after API response arrives)
  useEffect(() => {
    if (isIntersectingRef.current) {
      startAnimation(currentValRef.current, value);
    } else {
      setDisplayValue(value);
    }
  }, [value, startAnimation]);

  const formatted = formatter
    ? formatter(displayValue)
    : decimals > 0
    ? displayValue.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(displayValue).toLocaleString("id-ID");

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  delay?: number; // ms
  duration?: number; // ms
  className?: string;
  distance?: number; // px
}

/**
 * ScrollReveal reveals content smoothly with fade and direction motion
 * as it enters the viewport on scroll.
 */
export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  className = "",
  distance = 26,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0)`;
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      case "fade":
      default:
        return "translate3d(0, 0, 0) scale(0.97)";
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
