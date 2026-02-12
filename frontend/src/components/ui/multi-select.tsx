'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  label,
  className,
  triggerClassName,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const triggerLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label ?? value[0]
        : `${value.length} selecionados`;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-[200px] justify-between font-normal',
              triggerClassName
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-2" align="start">
          {options.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs mb-1"
              onClick={selectAll}
            >
              {value.length === options.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </Button>
          )}
          <div className="max-h-[280px] overflow-y-auto space-y-1">
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent'
                )}
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
