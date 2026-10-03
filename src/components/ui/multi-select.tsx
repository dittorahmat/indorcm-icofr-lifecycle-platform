import * as React from "react";
import { X, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
  isWarning?: boolean; // Untuk indikasi Red Font
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  onCreateNew?: (name: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  onCreateNew,
  className,
  disabled
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setCommandInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...selected, item]);
    }
  };

  const selectedLabels = React.useMemo(() => {
    return selected.map(val => {
        const opt = options.find(o => o.value === val);
        return { value: val, label: opt?.label || val, isWarning: opt?.isWarning };
    });
  }, [selected, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-9 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer items-center",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedLabels.map((item) => (
                <Badge
                  key={item.value}
                  variant="secondary"
                  className={cn(
                      "flex items-center gap-1 px-2 py-0.5 h-auto min-h-6 leading-none",
                      item.isWarning && "text-destructive border-destructive/30 bg-destructive/5 font-bold"
                  )}
                >
                  <span className="truncate max-w-[120px]">{item.label}</span>
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item.value);
                    }}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={inputValue}
            onValueChange={setCommandInputValue}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onPointerDown={(e) => {
                    // Prevent focus loss from the input
                    e.preventDefault();
                  }}
                  onSelect={() => {
                    handleSelect(option.value);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {selected.includes(option.value) && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn("text-xs", option.isWarning && "text-destructive font-medium")}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {inputValue && !options.some(o => o.label.toLowerCase() === inputValue.toLowerCase()) && onCreateNew && (
              <>
                <CommandSeparator />
                <div 
                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-indigo-600 font-bold hover:bg-indigo-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    onCreateNew(inputValue);
                    setCommandInputValue("");
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add "{inputValue}"
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
