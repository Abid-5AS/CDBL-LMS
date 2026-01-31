import type { Transition, Variants } from "framer-motion";

const DURATIONS = {
  micro: 0.15,
  small: 0.25,
  medium: 0.35,
  large: 0.5,
  xl: 0.8,
} as const;

const EASINGS = {
  easeIn: [0.4, 0, 1, 1] as Transition["ease"],
  easeOut: [0, 0, 0.2, 1] as Transition["ease"],
  easeInOut: [0.4, 0, 0.2, 1] as Transition["ease"],
  spring: [0.22, 1, 0.36, 1] as Transition["ease"],
};

type VariantOptions = {
  delay?: number;
  duration?: number;
  distance?: number;
  opacity?: number;
};

const withReducedMotion = (
  variants: Variants,
  reducedMotion?: boolean,
  fallback?: Partial<Variants>
): Variants => {
  if (!reducedMotion) return variants;
  return {
    initial: { opacity: 1, y: 0, scale: 1 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
    exit: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
    ...fallback,
  };
};

export const fadeIn = (
  { delay = 0, duration = DURATIONS.medium }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { duration, delay, ease: EASINGS.easeOut },
      },
      exit: {
        opacity: 0,
        transition: { duration: duration * 0.6, ease: EASINGS.easeIn },
      },
    },
    reducedMotion
  );

export const slideUp = (
  { delay = 0, duration = DURATIONS.medium, distance = 20 }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      initial: { opacity: 0, y: distance },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration, delay, ease: EASINGS.easeOut },
      },
      exit: {
        opacity: 0,
        y: distance * 0.6,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
    },
    reducedMotion
  );

export const slideInFromRight = (
  { delay = 0, duration = DURATIONS.medium, distance = 30 }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      initial: { opacity: 0, x: distance },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration, delay, ease: EASINGS.easeOut },
      },
      exit: {
        opacity: 0,
        x: distance * 0.6,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
    },
    reducedMotion
  );

export const scaleIn = (
  { delay = 0, duration = DURATIONS.small }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      initial: { opacity: 0, scale: 0.95 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { duration, delay, ease: EASINGS.spring },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
    },
    reducedMotion
  );

export const staggerChildren = (interval = 0.05): Variants => ({
  animate: {
    transition: {
      staggerChildren: interval,
      delayChildren: interval,
    },
  },
});

export const listItem = (
  { delay = 0, duration = DURATIONS.small, distance = 16 }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      initial: { opacity: 0, x: distance },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration, delay, ease: EASINGS.easeOut },
      },
      exit: {
        opacity: 0,
        x: distance * -0.35,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
    },
    reducedMotion
  );

export const modalVariants = (
  { delay = 0, duration = DURATIONS.medium }: VariantOptions = {},
  reducedMotion?: boolean
): Variants =>
  withReducedMotion(
    {
      backdrop: {
        opacity: 0,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
      backdropVisible: {
        opacity: 1,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeOut },
      },
      initial: { opacity: 0, scale: 0.95, y: 12 },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: EASINGS.spring,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: 12,
        transition: { duration: DURATIONS.small, ease: EASINGS.easeIn },
      },
    },
    reducedMotion,
    {
      backdrop: { opacity: 0 },
      backdropVisible: { opacity: 1 },
    }
  );

export const badgePulse = (reducedMotion?: boolean): Variants =>
  withReducedMotion(
    {
      animate: {
        opacity: [0.75, 1, 0.75],
        transition: {
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        },
      },
    },
    reducedMotion,
    { animate: { opacity: 1 } }
  );

export const motionTokens = {
  durations: DURATIONS,
  easings: EASINGS,
};

export type MotionDurations = typeof DURATIONS;
export type MotionEasings = typeof EASINGS;

/**
 * Simplified animation duration constants for quick access
 * Maps to DURATIONS for backwards compatibility
 */
export const ANIMATION_DURATIONS = {
  /** Fast animations for micro-interactions (hover, focus, ripple effects) */
  fast: DURATIONS.micro,      // 0.15s

  /** Normal animations for standard transitions (cards, modals, dropdowns) */
  normal: DURATIONS.medium,   // 0.35s

  /** Slow animations for page transitions and major layout changes */
  slow: DURATIONS.large,      // 0.5s
} as const;

