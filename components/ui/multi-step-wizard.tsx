"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  optional?: boolean;
  validation?: () => boolean | Promise<boolean>;
}

interface MultiStepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void;
  onComplete?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  showStepNumbers?: boolean;
  allowSkipOptional?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  completeButtonText?: string;
  isLoading?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const progressVariants = {
  initial: { width: 0 },
  animate: { width: "100%" },
};

export function MultiStepWizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onComplete,
  children,
  className,
  showStepNumbers = true,
  allowSkipOptional = true,
  nextButtonText = "Next",
  previousButtonText = "Previous",
  completeButtonText = "Complete",
  isLoading = false,
  canGoNext = true,
  canGoPrevious = true,
}: MultiStepWizardProps) {
  const [direction, setDirection] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (isLoading || !canGoNext) return;

    // Validate current step if validation function exists
    if (currentStepData.validation) {
      const isValid = await currentStepData.validation();
      if (!isValid) return;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (isLastStep) {
      await onComplete?.();
    } else {
      setDirection(1);
      const nextStep = currentStep + 1;
      onStepChange(nextStep);
      await onNext?.();
    }
  };

  const handlePrevious = () => {
    if (isLoading || !canGoPrevious || isFirstStep) return;

    setDirection(-1);
    const prevStep = currentStep - 1;
    onStepChange(prevStep);
    onPrevious?.();
  };

  const handleStepClick = (stepIndex: number) => {
    if (isLoading || stepIndex === currentStep) return;

    // Allow going to previous steps or completed steps
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      setDirection(stepIndex > currentStep ? 1 : -1);
      onStepChange(stepIndex);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {currentStepData.title}
          </h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {currentStepData.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {currentStepData.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isClickable = index < currentStep || completedSteps.has(index);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <button
                onClick={() => handleStepClick(index)}
                disabled={!isClickable || isLoading}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground shadow-lg scale-110",
                  isCompleted &&
                    !isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  !isActive &&
                    !isCompleted &&
                    "border-muted-foreground/30 bg-background text-muted-foreground",
                  isClickable && !isLoading && "hover:scale-105 cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-5 h-5" />
                ) : Icon ? (
                  <Icon className="w-5 h-5" />
                ) : showStepNumbers ? (
                  <span className="text-sm font-medium">{index + 1}</span>
                ) : null}

                {/* Active step pulse animation */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </button>

              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isActive && "text-primary",
                    isCompleted && !isActive && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {step.optional && (
                  <p className="text-xs text-muted-foreground mt-1">Optional</p>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-muted-foreground/20 -z-10">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        index < currentStep || completedSteps.has(index)
                          ? "100%"
                          : "0%",
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="relative min-h-[400px] mb-8">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading || !canGoPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {previousButtonText}
        </Button>

        <div className="flex items-center gap-2">
          {currentStepData.optional && allowSkipOptional && !isLastStep && (
            <Button
              variant="ghost"
              onClick={() => {
                setDirection(1);
                onStepChange(currentStep + 1);
              }}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={isLoading || !canGoNext}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isLastStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {isLastStep ? completeButtonText : nextButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing wizard state
export function useMultiStepWizard(initialStep = 0) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [isLoading, setIsLoading] = React.useState(false);

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const reset = () => {
    setCurrentStep(initialStep);
    setIsLoading(false);
  };

  return {
    currentStep,
    isLoading,
    setIsLoading,
    goToStep,
    nextStep,
    previousStep,
    reset,
  };
}
