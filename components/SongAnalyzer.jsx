'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Music, CheckCircle, XCircle, AlertCircle, Info, Bug } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { sampleSongs } from '@/data/sample-songs';

const getColorFromText = (text) => {
  if (!text) return 'bg-gray-50';
  
  // Simple hash function to generate a number from text
  const hash = text.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use an array of predefined Tailwind colors
  const colors = [
    'bg-blue-50',
    'bg-purple-50',
    'bg-pink-50',
    'bg-indigo-50',
    'bg-teal-50',
    'bg-cyan-50',
    'bg-rose-50',
    'bg-fuchsia-50',
    'bg-violet-50',
    'bg-sky-50',
  ];
  
  // Select a color based on the hash
  return colors[Math.abs(hash) % colors.length];
};

const SongAnalyzer = () => {
  const [lyrics, setLyrics] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('basic'); // 'basic', 'advanced', or 'freeplay'
  const [rawApiOutput, setRawApiOutput] = useState('');
  const [title, setTitle] = useState('');

  const loadSampleSong = (songKey) => {
    setTitle(songKey);
    setLyrics(sampleSongs[songKey]);
    setResult(null);
    setError('');
    setRawApiOutput('');
  };

  const handleLyricsChange = (e) => {
    const newLyrics = e.target.value;
    setLyrics(newLyrics);
    // Clear the result when lyrics change
    if (result) {
      setResult(null);
      setError('');
    }
  };

  const analyzeLyrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      let endpoint = '/api/analyze';
      if (mode === 'advanced') endpoint += '/advanced';
      if (mode === 'freeplay') endpoint += '/freeplay';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics, title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Store the raw output if in advanced or freeplay mode
      if ((mode === 'advanced' || mode === 'freeplay') && data.rawOutput) {
        setRawApiOutput(data.rawOutput);
      }
    } catch (error) {
      setError(error.message || 'Error analyzing lyrics');
      setResult(mode === 'basic' ? 'FALSE' : null);
    } finally {
      setIsLoading(false);
    }
  };

  const getBackgroundColor = () => {
    if (result) {
      if (mode !== 'basic') return 'bg-gray-50';
      switch (result) {
        case 'TRUE':
          return 'bg-green-50';
        case 'FALSE':
          return 'bg-red-50';
        default:
          return 'bg-yellow-50';
      }
    }
    // Return dynamic color based on lyrics when no result
    return getColorFromText(lyrics);
  };

  const getResultDisplay = () => {
    if (!result) return null;
    
    if (!mode === 'basic') {
      // Add type check for basic mode
      if (typeof result === 'string') {
        const config = {
          TRUE: {
            icon: CheckCircle,
            text: 'Kid Friendly',
            color: 'text-green-600',
          },
          FALSE: {
            icon: XCircle,
            text: 'Not Kid Friendly',
            color: 'text-red-600',
          }
        };

        const ResultIcon = config[result]?.icon;  // Add optional chaining
        if (!ResultIcon) return null;  // Safety check

        return (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${config[result].color}`}>
              <ResultIcon className="w-6 h-6" />
              <span className="text-lg font-semibold">{config[result].text}</span>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        );
      }
      return null;  // Return null if result is not in the expected format
    }

    // Advanced result display
    return (
      <div className="space-y-4 w-full">
        {result.title && (
          <div className="text-lg font-semibold text-gray-900">
            {result.title}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <ResultCard
            title="Genre"
            value={result.genre}
            icon={Music}
          />
          <ResultCard
            title="Explicitness"
            value={result.explicit ? 'Explicit' : 'Clean'}
            icon={AlertCircle}
            valueColor={result.explicit ? 'text-red-600' : 'text-green-600'}
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Info className="w-5 h-5" />
              Song Analysis
            </h3>
            <p className="text-gray-700">{result.summary}</p>
          </div>
          
          {result.themes && result.themes.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Main Themes</h4>
              <div className="flex flex-wrap gap-2">
                {result.themes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {result.mood && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-1">Overall Mood</h4>
              <p className="text-gray-700">{result.mood}</p>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${getBackgroundColor()} transition-all duration-700`}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Music className="w-6 h-6" />
                Song Analyzer
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <select
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value);
                      setResult(null);
                      setError('');
                      setRawApiOutput('');
                    }}
                    className="px-2 py-1 border rounded-md text-sm"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                    <option value="freeplay">Freeplay</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Song title (optional)"
                  className="w-full px-3 py-2 border rounded-md"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Paste song lyrics here..."
                  className="min-h-[200px]"
                  value={lyrics}
                  onChange={handleLyricsChange}
                />
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">Try a sample:</span>
                  {Object.keys(sampleSongs).map((songName) => (
                    <Button
                      key={songName}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSampleSong(songName)}
                    >
                      {songName}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={analyzeLyrics}
                  disabled={!lyrics.trim() || isLoading}
                  className="w-32"
                >
                  {isLoading ? 'Analyzing...' : 'Check'}
                </Button>
                {mode === 'advanced' && result && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="w-10">
                        <Bug className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Raw API Output</DialogTitle>
                      </DialogHeader>
                      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                        {rawApiOutput}
                      </pre>
                    </DialogContent>
                  </Dialog>
                )}
                {getResultDisplay()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ResultCard = ({ title, value, icon: Icon, valueColor = 'text-gray-900' }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="text-sm text-gray-600 flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4" />
      {title}
    </h3>
    <p className={`font-semibold ${valueColor}`}>{value}</p>
  </div>
);

export default SongAnalyzer;