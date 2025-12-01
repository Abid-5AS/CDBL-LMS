"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  options?: {
    persistent?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    stackable?: boolean;
    priority?: number;
  };
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  options: ModalConfig["options"];
  zIndex: number;
  timestamp: number;
}

export function useModalManager() {
  const [modals, setModals] = useState<Map<string, ModalState>>(new Map());
  const [modalStack, setModalStack] = useState<string[]>([]);
  const baseZIndex = useRef(1000);
  const nextId = useRef(0);

  // Generate unique modal ID
  const generateId = useCallback(() => {
    return `modal-${++nextId.current}-${Date.now()}`;
  }, []);

  // Calculate z-index for modal
  const calculateZIndex = useCallback(
    (priority = 0) => {
      return baseZIndex.current + modalStack.length + priority;
    },
    [modalStack.length]
  );

  // Open a modal
  const openModal = useCallback(
    (config: Omit<ModalConfig, "id"> & { id?: string }) => {
      const id = config.id || generateId();
      const timestamp = Date.now();
      const zIndex = calculateZIndex(config.options?.priority);

      const modalState: ModalState = {
        id,
        isOpen: true,
        component: config.component,
        props: config.props || {},
        options: config.options || {},
        zIndex,
        timestamp,
      };

      setModals((prev) => new Map(prev).set(id, modalState));
      setModalStack((prev) => [...prev, id]);

      return id;
    },
    [generateId, calculateZIndex]
  );

  // Close a modal
  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const newModals = new Map(prev);
      const modal = newModals.get(id);
      if (modal) {
        newModals.set(id, { ...modal, isOpen: false });
      }
      return newModals;
    });

    // Remove from stack after animation
    setTimeout(() => {
      setModals((prev) => {
        const newModals = new Map(prev);
        newModals.delete(id);
        return newModals;
      });
      setModalStack((prev) => prev.filter((modalId) => modalId !== id));
    }, 300); // Match animation duration
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    modals.forEach((_, id) => {
      closeModal(id);
    });
  }, [modals, closeModal]);

  // Close top modal
  const closeTopModal = useCallback(() => {
    if (modalStack.length > 0) {
      const topModalId = modalStack[modalStack.length - 1];
      closeModal(topModalId);
    }
  }, [modalStack, closeModal]);

  // Update modal props
  const updateModal = useCallback(
    (id: string, newProps: Record<string, any>) => {
      setModals((prev) => {
        const newModals = new Map(prev);
        const modal = newModals.get(id);
        if (modal) {
          newModals.set(id, {
            ...modal,
            props: { ...modal.props, ...newProps },
          });
        }
        return newModals;
      });
    },
    []
  );

  // Check if modal is open
  const isModalOpen = useCallback(
    (id: string) => {
      return modals.get(id)?.isOpen || false;
    },
    [modals]
  );

  // Get modal state
  const getModal = useCallback(
    (id: string) => {
      return modals.get(id) || null;
    },
    [modals]
  );

  // Get all open modals
  const getOpenModals = useCallback(() => {
    return Array.from(modals.values()).filter((modal) => modal.isOpen);
  }, [modals]);

  // Get top modal
  const getTopModal = useCallback(() => {
    if (modalStack.length === 0) return null;
    const topModalId = modalStack[modalStack.length - 1];
    return modals.get(topModalId) || null;
  }, [modalStack, modals]);

  // Handle escape key for closing modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const topModal = getTopModal();
        if (topModal && topModal.options?.closeOnEscape !== false) {
          closeModal(topModal.id);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [getTopModal, closeModal]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    const hasOpenModals = getOpenModals().length > 0;

    if (hasOpenModals) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [getOpenModals]);

  return {
    // State
    modals: Array.from(modals.values()),
    modalStack,

    // Actions
    openModal,
    closeModal,
    closeAllModals,
    closeTopModal,
    updateModal,

    // Queries
    isModalOpen,
    getModal,
    getOpenModals,
    getTopModal,

    // Utilities
    hasOpenModals: getOpenModals().length > 0,
    modalCount: modals.size,
  };
}

// Hook for individual modal management
export function useModal(id?: string) {
  const [modalId] = useState(id || `modal-${Date.now()}`);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    id: modalId,
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen,
  };
}

// Hook for confirmation modals
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  } | null>(null);

  const confirm = useCallback((confirmConfig: NonNullable<typeof config>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...confirmConfig,
        onConfirm: async () => {
          try {
            await confirmConfig.onConfirm();
            resolve(true);
          } catch (error) {
            resolve(false);
          }
        },
        onCancel: () => {
          confirmConfig.onCancel?.();
          resolve(false);
        },
      });
      setIsOpen(true);
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  return {
    isOpen,
    config,
    confirm,
    closeModal,
  };
}

// Hook for form modals
export function useFormModal<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");

  const openCreateModal = useCallback((initialData?: Partial<T>) => {
    setMode("create");
    setData((initialData as T) || null);
    setIsOpen(true);
  }, []);

  const openEditModal = useCallback((editData: T) => {
    setMode("edit");
    setData(editData);
    setIsOpen(true);
  }, []);

  const openViewModal = useCallback((viewData: T) => {
    setMode("view");
    setData(viewData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    isOpen,
    data,
    mode,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    setIsOpen,
  };
}

// Hook for multi-step modals
export function useMultiStepModal(totalSteps: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const openModal = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrevious = currentStep > 0;

  return {
    isOpen,
    currentStep,
    completedSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    openModal,
    closeModal,
    nextStep,
    previousStep,
    goToStep,
    reset,
    setIsOpen,
  };
}

// Utility functions
export const modalUtils = {
  // Create a modal configuration
  createModalConfig: (
    component: React.ComponentType<any>,
    props?: Record<string, any>,
    options?: ModalConfig["options"]
  ): Omit<ModalConfig, "id"> => ({
    component,
    props,
    options,
  }),

  // Create a confirmation modal configuration
  createConfirmationConfig: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: "default" | "destructive";
      onCancel?: () => void;
    }
  ) => ({
    title,
    description,
    confirmText: options?.confirmText || "Confirm",
    cancelText: options?.cancelText || "Cancel",
    variant: options?.variant || "default",
    onConfirm,
    onCancel: options?.onCancel,
  }),
};
