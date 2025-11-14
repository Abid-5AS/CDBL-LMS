"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  data?: any;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  creatable?: boolean;
  maxSelected?: number;
  className?: string;

  // Search
  searchable?: boolean;
  onSearch?: (query: string) => void;
  searchDelay?: number;

  // Async
  onLoadOptions?: (query: string) => Promise<AutocompleteOption[]>;

  // Rendering
  renderOption?: (
    option: AutocompleteOption,
    isSelected: boolean
  ) => React.ReactNode;
  renderValue?: (option: AutocompleteOption) => React.ReactNode;

  // Validation
  error?: string;
  required?: boolean;

  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  onCreate?: (value: string) => void;
}

export function Autocomplete({
  options: initialOptions,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  multiple = false,
  disabled = false,
  loading = false,
  clearable = true,
  creatable = false,
  maxSelected,
  className,
  searchable = true,
  onSearch,
  searchDelay = 300,
  onLoadOptions,
  renderOption,
  renderValue,
  error,
  required = false,
  onFocus,
  onBlur,
  onCreate,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [options, setOptions] = React.useState(initialOptions);
  const [isLoading, setIsLoading] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Convert value to array for consistent handling
  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value ? [value] : [];
  }, [value, multiple]);

  // Get selected options
  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Group options
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, AutocompleteOption[]> = {};
    const ungrouped: AutocompleteOption[] = [];

    filteredOptions.forEach((option) => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [filteredOptions]);

  // Handle search with debouncing
  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearch?.(query);

        if (onLoadOptions) {
          setIsLoading(true);
          onLoadOptions(query)
            .then((newOptions) => {
              setOptions(newOptions);
            })
            .catch((error) => {
              console.error("Failed to load options:", error);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      }, searchDelay);
    },
    [onSearch, onLoadOptions, searchDelay]
  );

  // Handle option selection
  const handleSelect = React.useCallback(
    (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];

        // Check max selected limit
        if (maxSelected && newValues.length > maxSelected) {
          return;
        }

        onValueChange(newValues);
      } else {
        onValueChange(optionValue);
        setOpen(false);
      }
    },
    [multiple, selectedValues, maxSelected, onValueChange]
  );

  // Handle clear
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange(multiple ? [] : "");
    },
    [multiple, onValueChange]
  );

  // Handle create new option
  const handleCreate = React.useCallback(() => {
    if (creatable && searchQuery && onCreate) {
      onCreate(searchQuery);
      setSearchQuery("");
    }
  }, [creatable, searchQuery, onCreate]);

  // Update options when initialOptions change
  React.useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const displayValue = React.useMemo(() => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === 1) {
      return renderValue
        ? renderValue(selectedOptions[0])
        : selectedOptions[0].label;
    }
    return `${selectedOptions.length} selected`;
  }, [selectedOptions, placeholder, renderValue]);

  const showCreateOption =
    creatable &&
    searchQuery &&
    !filteredOptions.some(
      (option) => option.label.toLowerCase() === searchQuery.toLowerCase()
    );

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selectedValues.length && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {multiple && selectedOptions.length > 1 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.slice(0, 2).map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="text-xs"
                    >
                      {option.label}
                    </Badge>
                  ))}
                  {selectedOptions.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedOptions.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="truncate">{displayValue}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {clearable && selectedValues.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {loading || isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-50" />
              )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <div className="flex flex-col max-h-80">
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <AnimatePresence>
                  {/* Create Option */}
                  {showCreateOption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto p-2 font-normal"
                        onClick={handleCreate}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-dashed border-muted-foreground" />
                          <span>Create "{searchQuery}"</span>
                        </div>
                      </Button>
                    </motion.div>
                  )}

                  {/* Ungrouped Options */}
                  {groupedOptions.ungrouped.map((option) => (
                    <OptionItem
                      key={option.value}
                      option={option}
                      isSelected={selectedValues.includes(option.value)}
                      onSelect={handleSelect}
                      renderOption={renderOption}
                    />
                  ))}

                  {/* Grouped Options */}
                  {Object.entries(groupedOptions.groups).map(
                    ([groupName, groupOptions]) => (
                      <div key={groupName}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                          {groupName}
                        </div>
                        {groupOptions.map((option) => (
                          <OptionItem
                            key={option.value}
                            option={option}
                            isSelected={selectedValues.includes(option.value)}
                            onSelect={handleSelect}
                            renderOption={renderOption}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* Empty State */}
                  {filteredOptions.length === 0 && !showCreateOption && (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Option Item Component
interface OptionItemProps {
  option: AutocompleteOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  renderOption?: (
    option: AutocompleteOption,
    isSelected: boolean
  ) => React.ReactNode;
}

function OptionItem({
  option,
  isSelected,
  onSelect,
  renderOption,
}: OptionItemProps) {
  if (renderOption) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        whileHover={{ backgroundColor: "var(--muted)" }}
        className="cursor-pointer"
        onClick={() => !option.disabled && onSelect(option.value)}
      >
        {renderOption(option, isSelected)}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{
        backgroundColor: option.disabled ? undefined : "var(--muted)",
      }}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-auto p-2 font-normal",
          isSelected && "bg-accent",
          option.disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !option.disabled && onSelect(option.value)}
        disabled={option.disabled}
      >
        <div className="flex items-center gap-2 w-full">
          <div
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center",
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground"
            )}
          >
            {isSelected && (
              <Check className="w-3 h-3 text-primary-foreground" />
            )}
          </div>

          <div className="flex-1 text-left">
            <div className="font-medium">{option.label}</div>
            {option.description && (
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            )}
          </div>
        </div>
      </Button>
    </motion.div>
  );
}

// Hook for managing autocomplete state
export function useAutocomplete(initialOptions: AutocompleteOption[] = []) {
  const [options, setOptions] = React.useState(initialOptions);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadOptions = React.useCallback(
    async (
      loader: (query: string) => Promise<AutocompleteOption[]>,
      query: string = ""
    ) => {
      setLoading(true);
      setError(null);

      try {
        const newOptions = await loader(query);
        setOptions(newOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load options");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addOption = React.useCallback((option: AutocompleteOption) => {
    setOptions((prev) => [...prev, option]);
  }, []);

  const removeOption = React.useCallback((value: string) => {
    setOptions((prev) => prev.filter((option) => option.value !== value));
  }, []);

  const updateOption = React.useCallback(
    (value: string, updates: Partial<AutocompleteOption>) => {
      setOptions((prev) =>
        prev.map((option) =>
          option.value === value ? { ...option, ...updates } : option
        )
      );
    },
    []
  );

  const reset = React.useCallback(() => {
    setOptions(initialOptions);
    setLoading(false);
    setError(null);
  }, [initialOptions]);

  return {
    options,
    loading,
    error,
    setOptions,
    loadOptions,
    addOption,
    removeOption,
    updateOption,
    reset,
  };
}
