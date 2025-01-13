'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Shuffle } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

const SongSelector = ({ onSongSelect }) => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/songs?q=${encodeURIComponent(debouncedSearch)}&limit=50`);
      const data = await response.json();
      setSongs(data.songs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = async (title) => {
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  useEffect(() => {
    loadSongs();
  }, [debouncedSearch]);

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Browse songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomSong}
          disabled={loading}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Shuffle className="w-4 h-4" />
          Random
        </Button>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-2 gap-1 pr-4">
          {songs.map((song) => (
            <button
              key={song.title}
              onClick={() => handleSongSelect(song.title)}
              className="text-left p-2 rounded hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="font-medium text-sm truncate">{song.title}</div>
              <div className="text-xs text-gray-600 truncate">{song.artist}</div>
            </button>
          ))}
          {loading && (
            <div className="col-span-2 py-2 text-center text-sm text-gray-500">
              Loading...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SongSelector; 