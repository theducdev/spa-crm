"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

interface Option {
  value: string
  label: string
}

interface SearchableComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className,
}: SearchableComboboxProps) {
  const selectedOption = options.find((option) => option.value === value)
  const [searchQuery, setSearchQuery] = React.useState(selectedOption?.label || "")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Update search query when value changes externally
  React.useEffect(() => {
    const option = options.find((opt) => opt.value === value)
    if (option) {
      setSearchQuery(option.label)
    }
  }, [value, options])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    
    const normalized = searchQuery.toLowerCase().trim()
    const searchTerms = normalized.split(/\s+/)
    
    return options.filter((option) => {
      const normalizedLabel = option.label.toLowerCase()
      return searchTerms.every(term => normalizedLabel.includes(term))
    })
  }, [options, searchQuery])

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    setIsOpen(true)
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      {isOpen && (
        <div 
          className="absolute left-0 w-full bg-popover rounded-md border shadow-lg mt-1" 
          style={{ 
            zIndex: 9999,
            position: 'absolute',
            top: '100%',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setSearchQuery(option.label)
                    setIsOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              Không tìm thấy kết quả cho "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  )
} 