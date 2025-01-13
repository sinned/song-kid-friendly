'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Search, Loader2, Shuffle } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

const SongSelector = ({ onSongSelect }) => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadSongs = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;
    
    const currentPage = reset ? 1 : page;
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/songs?q=${encodeURIComponent(debouncedSearch)}&page=${currentPage}&limit=20`
      );
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setSongs(prev => reset ? data.songs : [...prev, ...data.songs]);
      setHasMore(currentPage < data.totalPages);
      if (!reset) setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, hasMore]);

  const handleSongSelect = async (title) => {
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });
      
      const song = await response.json();
      if (song.error) throw new Error(song.error);
      
      onSongSelect(song);
    } catch (error) {
      console.error('Failed to load song details:', error);
    }
  };

  const handleRandomSong = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/songs?random=true');
      const song = await response.json();
      if (song.error) throw new Error(song.error);
      onSongSelect(song);
    } catch (error) {
      console.error('Failed to load random song:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial songs
  useEffect(() => {
    loadSongs(true);
  }, [debouncedSearch]);

  // Intersection Observer for infinite scroll
  const lastSongRef = useCallback(node => {
    if (loading) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadSongs();
      }
    });
    
    if (node) observer.observe(node);
  }, [loading, hasMore, loadSongs]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Song Library
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomSong}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <Shuffle className="w-4 h-4" />
            Random
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search songs or artists..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSongs([]);
              setPage(1);
              setHasMore(true);
            }}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {songs.map((song, index) => (
              <button
                key={song.title}
                ref={index === songs.length - 1 ? lastSongRef : null}
                onClick={() => handleSongSelect(song.title)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 space-y-1"
              >
                <div className="font-medium">{song.title}</div>
                <div className="text-sm text-gray-600">{song.artist}</div>
              </button>
            ))}
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SongSelector; 