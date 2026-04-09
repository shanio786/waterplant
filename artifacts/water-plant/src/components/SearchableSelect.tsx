import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  sub?: string;
}

interface Props {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  disabled,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-testid={testId}
          className={cn(
            "w-full justify-between font-normal h-9 text-sm",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <div className="flex items-center border-b px-2 py-1.5">
          <Search className="h-3.5 w-3.5 mr-1.5 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm"
          />
        </div>
        <div className="max-h-52 overflow-auto">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No results found
            </p>
          ) : (
            filtered.map((o) => (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-accent",
                  o.value === value && "bg-accent"
                )}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    o.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate">{o.label}</p>
                  {o.sub && (
                    <p className="text-xs text-muted-foreground truncate">{o.sub}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
