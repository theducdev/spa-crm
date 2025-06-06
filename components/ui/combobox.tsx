"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  multiple?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy kết quả.",
  className,
  multiple = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : []

  const handleSelect = (currentValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(currentValue)
        ? selectedValues.filter((v) => v !== currentValue)
        : [...selectedValues, currentValue]
      onValueChange?.(newValues)
    } else {
      onValueChange?.(currentValue)
      setOpen(false)
    }
  }

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      const newValues = selectedValues.filter((v) => v !== valueToRemove)
      onValueChange?.(newValues)
    }
  }

  const handleKeyDown = (valueToRemove: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const newValues = selectedValues.filter((v) => v !== valueToRemove)
      onValueChange?.(newValues)
    }
  }

  // Cải thiện logic tìm kiếm
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options

    const normalizedQuery = searchQuery.toLowerCase().trim()
    const searchTerms = normalizedQuery.split(/\s+/)

    return options.filter((option) => {
      const normalizedLabel = option.label.toLowerCase()
      // Kiểm tra xem tất cả các từ tìm kiếm có xuất hiện trong label không
      return searchTerms.every(term => normalizedLabel.includes(term))
    })
  }, [options, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
            {multiple ? (
              selectedValues.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedValues.map((selectedValue) => (
                    <Badge
                      key={selectedValue}
                      variant="secondary"
                      className="mr-1 mb-1"
                    >
                      {options.find((opt) => opt.value === selectedValue)?.label}
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                        onClick={(e) => removeValue(selectedValue, e)}
                        onKeyDown={(e) => handleKeyDown(selectedValue, e)}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )
            ) : (
              <span className="truncate">
                {value
                  ? options.find((option) => option.value === value)?.label
                  : placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    multiple
                      ? selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                      : value === option.value
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 