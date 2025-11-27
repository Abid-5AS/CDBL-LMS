"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, Filter, Maximize2, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Date Range Picker ---

interface DatePickerWithRangeProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    className?: string;
}

export function DatePickerWithRange({
    date,
    setDate,
    className,
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

// --- Filter Panel ---

interface FilterOption {
    label: string;
    value: string;
}

interface FilterPanelProps {
    title?: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
}

export function FilterPanel({
    title = "Filter",
    options,
    selected,
    onChange,
    className,
}: FilterPanelProps) {
    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 border-dashed", className)}>
                    <Filter className="mr-2 h-4 w-4" />
                    {title}
                    {selected.length > 0 && (
                        <>
                            <div className="mx-2 h-4 w-[1px] bg-accent" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selected.length}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selected.length > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selected.length} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selected.includes(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2">
                    {options.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={cn(
                                    "flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    isSelected && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <div
                                    className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible"
                                    )}
                                >
                                    <svg
                                        className={cn("h-4 w-4")}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <span>{option.label}</span>
                            </div>
                        );
                    })}
                    {selected.length > 0 && (
                        <>
                            <div className="my-1 h-[1px] bg-border" />
                            <div
                                className="flex cursor-pointer items-center justify-center rounded-sm px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                onClick={() => onChange([])}
                            >
                                Clear filters
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// --- Export Controls ---

interface ExportControlsProps {
    onExportPNG?: () => void;
    onExportSVG?: () => void;
    onExportCSV?: () => void;
    className?: string;
}

export function ExportControls({
    onExportPNG,
    onExportSVG,
    onExportCSV,
    className,
}: ExportControlsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8", className)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onExportPNG && (
                    <DropdownMenuItem onClick={onExportPNG}>
                        Export as PNG
                    </DropdownMenuItem>
                )}
                {onExportSVG && (
                    <DropdownMenuItem onClick={onExportSVG}>
                        Export as SVG
                    </DropdownMenuItem>
                )}
                {onExportCSV && (
                    <DropdownMenuItem onClick={onExportCSV}>
                        Export Data (CSV)
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// --- Drill Down Modal ---

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function DrillDownModal({
    isOpen,
    onClose,
    title,
    children,
}: DrillDownModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                    {children}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
