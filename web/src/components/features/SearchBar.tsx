'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  /** Debounce delay in ms (default: 300) */
  debounceDelay?: number;
  /** Whether to debounce the search */
  debounced?: boolean;
  /** Initial value */
  defaultValue?: string;
}

export function SearchBar({
  onSearch,
  placeholder = '검색어를 입력하세요...',
  className,
  debounceDelay = 300,
  debounced = true,
  defaultValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Trigger search on debounced value change
  useEffect(() => {
    if (debounced) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch, debounced]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Immediate search on submit, regardless of debounce
      onSearch(query);
    },
    [query, onSearch]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      // If not debounced, trigger immediately
      if (!debounced) {
        onSearch(value);
      }
    },
    [debounced, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
