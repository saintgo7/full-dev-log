'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/features/EventCard';
import { useEventSearch } from '@/hooks/useEvents';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: results, isLoading } = useEventSearch(searchTerm);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div>
      <Header title="검색" />

      <div className="p-6 space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요 (파일명, 커밋 메시지, 브랜치 등)"
              className="pl-10"
            />
          </div>
          <Button type="submit">검색</Button>
        </form>

        {searchTerm && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              &quot;{searchTerm}&quot; 검색 결과
              {results && ` (${results.length}건)`}
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : results?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {results?.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">이벤트 검색</h3>
            <p className="text-sm text-muted-foreground">
              파일명, 커밋 메시지, 브랜치명 등으로 검색하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
