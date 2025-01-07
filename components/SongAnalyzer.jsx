'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Music, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const SongAnalyzer = () => {
  const [lyrics, setLyrics] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeLyrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics }),
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error analyzing lyrics:', error);
      setResult('UNKNOWN');
    }
    setIsLoading(false);
  };

  const getBackgroundColor = () => {
    if (!result) return 'bg-gray-50';
    switch (result) {
      case 'TRUE':
        return 'bg-green-50';
      case 'FALSE':
        return 'bg-red-50';
      default:
        return 'bg-yellow-50';
    }
  };

  const getResultDisplay = () => {
    if (!result) return null;
    
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
      },
      UNKNOWN: {
        icon: AlertCircle,
        text: 'Unable to Analyze',
        color: 'text-yellow-600',
      },
    };

    const ResultIcon = config[result].icon;

    return (
      <div className={`flex items-center gap-2 ${config[result].color}`}>
        <ResultIcon className="w-6 h-6" />
        <span className="text-lg font-semibold">{config[result].text}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${getBackgroundColor()} transition-colors duration-500`}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Music className="w-6 h-6" />
              Kid-Friendly Song Analyzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Textarea
                  placeholder="Paste song lyrics here..."
                  className="min-h-[200px]"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <Button
                  onClick={analyzeLyrics}
                  disabled={!lyrics.trim() || isLoading}
                  className="w-32"
                >
                  {isLoading ? 'Analyzing...' : 'Check'}
                </Button>
                {getResultDisplay()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SongAnalyzer;
