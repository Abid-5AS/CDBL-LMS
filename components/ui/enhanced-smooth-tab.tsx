"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface TabItem {
    id: string;
    title: string;
    icon?: LucideIcon;
    content?: React.ReactNode;
    cardContent?: React.ReactNode;
    color: string;
}

const WaveformPath = () => (
    <motion.path
        d="M0 50 
           C 20 40, 40 30, 60 50
           C 80 70, 100 60, 120 50
           C 140 40, 160 30, 180 50
           C 200 70, 220 60, 240 50
           C 260 40, 280 30, 300 50
           C 320 70, 340 60, 360 50
           C 380 40, 400 30, 420 50
           L 420 100 L 0 100 Z"
        initial={false}
        animate={{
            x: [0, 10, 0],
            transition: {
                duration: 5,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
            },
        }}
    />
);

interface EnhancedSmoothTabProps {
    items: TabItem[];
    defaultTabId?: string;
    value?: string; // Controlled value
    className?: string;
    activeColor?: string;
    onChange?: (tabId: string) => void;
    onDirectionChange?: (direction: number) => void; // New prop to notify parent of direction
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        filter: "blur(8px)",
        scale: 0.95,
        position: "absolute" as const,
    }),
    center: {
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
        scale: 1,
        position: "absolute" as const,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        filter: "blur(8px)",
        scale: 0.95,
        position: "absolute" as const,
    }),
};

const transition = {
    duration: 0.4,
    ease: [0.32, 0.72, 0, 1],
};

export default function EnhancedSmoothTab({
    items,
    defaultTabId,
    value,
    className,
    activeColor = "bg-[#1F9CFE]",
    onChange,
    onDirectionChange,
}: EnhancedSmoothTabProps) {
    const [internalSelected, setInternalSelected] = React.useState<string>(
        value || defaultTabId || items[0]?.id || ""
    );
    const [direction, setDirection] = React.useState(0);
    const [dimensions, setDimensions] = React.useState({ width: 0, left: 0 });

    // Use controlled value if provided, otherwise use internal state
    const selected = value !== undefined ? value : internalSelected;

    // Reference for the selected button
    const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const prevSelectedRef = React.useRef<string>(selected);

    // Track tab changes and calculate direction
    React.useEffect(() => {
        if (prevSelectedRef.current !== selected) {
            const currentIndex = items.findIndex((item) => item.id === prevSelectedRef.current);
            const newIndex = items.findIndex((item) => item.id === selected);
            
            if (currentIndex !== -1 && newIndex !== -1) {
                const newDirection = newIndex > currentIndex ? 1 : -1;
                setDirection(newDirection);
                onDirectionChange?.(newDirection);
            }
            
            prevSelectedRef.current = selected;
        }
    }, [selected, items, onDirectionChange]);

    // Update dimensions whenever selected tab changes or on mount
    React.useLayoutEffect(() => {
        const updateDimensions = () => {
            const selectedButton = buttonRefs.current.get(selected);
            const container = containerRef.current;

            if (selectedButton && container) {
                const rect = selectedButton.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                setDimensions({
                    width: rect.width,
                    left: rect.left - containerRect.left,
                });
            }
        };

        // Initial update
        requestAnimationFrame(() => {
            updateDimensions();
        });

        // Update on resize
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, [selected]);

    const handleTabClick = (tabId: string) => {
        const currentIndex = items.findIndex((item) => item.id === selected);
        const newIndex = items.findIndex((item) => item.id === tabId);
        const newDirection = newIndex > currentIndex ? 1 : -1;
        
        setDirection(newDirection);
        onDirectionChange?.(newDirection);
        
        if (value === undefined) {
            setInternalSelected(tabId);
        }
        onChange?.(tabId);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>,
        tabId: string
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTabClick(tabId);
        }
    };

    const selectedItem = items.find((item) => item.id === selected);

    return (
        <div className="flex flex-col h-full">
            {/* Card Content Area */}
            <div className="flex-1 mb-4 relative">
                <div className="bg-card border rounded-lg h-[200px] w-full relative">
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <AnimatePresence
                            initial={false}
                            mode="popLayout"
                            custom={direction}
                        >
                            <motion.div
                                key={`card-${selected}`}
                                custom={direction}
                                variants={slideVariants as any}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={transition as any}
                                className="absolute inset-0 w-full h-full will-change-transform bg-card"
                                style={{
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                }}
                            >
                                {selectedItem?.cardContent}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div
                ref={containerRef}
                role="tablist"
                aria-label="Smooth tabs"
                className={cn(
                    "flex items-center justify-between gap-1 py-1 mt-auto relative",
                    "bg-background w-[400px] mx-auto",
                    "border rounded-xl",
                    "transition-all duration-200",
                    className
                )}
            >
                {/* Sliding Background */}
                <motion.div
                    className={cn(
                        "absolute rounded-lg z-[1]",
                        selectedItem?.color || activeColor
                    )}
                    initial={false}
                    animate={{
                        width: dimensions.width - 8,
                        x: dimensions.left + 4,
                        opacity: 1,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                    }}
                    style={{ height: "calc(100% - 8px)", top: "4px" }}
                />

                <div className={`grid w-full gap-1 relative z-[2]`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                    {items.map((item) => {
                        const isSelected = selected === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                ref={(el) => {
                                    if (el) buttonRefs.current.set(item.id, el);
                                    else buttonRefs.current.delete(item.id);
                                }}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                aria-controls={`panel-${item.id}`}
                                id={`tab-${item.id}`}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => handleTabClick(item.id)}
                                onKeyDown={(e) => handleKeyDown(e, item.id)}
                                className={cn(
                                    "relative flex items-center justify-center gap-0.5 rounded-lg px-2 py-1.5",
                                    "text-sm font-medium transition-all duration-300",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    "truncate",
                                    isSelected
                                        ? "text-white"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <span className="truncate">{item.title}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}