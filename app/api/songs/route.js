import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache the songs data in memory
let songsCache = null;

const normalizeSong = (song) => {
  if (!song || typeof song !== 'object') return null;

  // Handle the actual field names from the JSON
  const title = song['Song Title'] || '';
  const artist = song['Artist'] || 'Unknown Artist';
  const lyrics = song['Lyrics'] || '';

  if (!title || !lyrics) return null;

  // Clean up lyrics by removing Genius-specific content
  const cleanLyrics = lyrics
    .replace(/See .* LiveGet tickets as low as \$\d+You might also like/g, '')
    .replace(/\d+Embed$/, '')
    .trim();

  return {
    title,
    artist,
    lyrics: cleanLyrics,
    album: song['Album'] || '',
    year: song['Year'] || '',
    releaseDate: song['Release Date'] || ''
  };
};

const loadSongs = () => {
  if (songsCache) return songsCache;
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'all_songs_data.json');
    console.log('Loading songs from:', filePath);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(fileContents);
    console.log('Raw data type:', typeof rawData);
    
    // Convert to array if it's an object
    const songsArray = Array.isArray(rawData) ? rawData : [rawData];
    console.log('Number of entries:', songsArray.length);
    
    // Process each song
    songsCache = songsArray
      .filter(song => song && song['Song Title'] && song['Lyrics'])
      .map(song => ({
        title: song['Song Title'],
        artist: song['Artist'] || 'Unknown Artist',
        lyrics: song['Lyrics'].replace(/See .* LiveGet tickets as low as \$\d+You might also like/g, '')
                             .replace(/\d+Embed$/, '')
                             .trim(),
        album: song['Album'] || '',
        year: song['Year'] || '',
        releaseDate: song['Release Date'] || ''
      }));
    
    console.log('Processed songs:', songsCache.length);
    return songsCache;
  } catch (error) {
    console.error('Error loading songs:', error);
    return [];
  }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const songs = loadSongs();
    
    // Handle random song request
    if (searchParams.get('random') === 'true') {
      if (songs.length === 0) {
        throw new Error('No songs found');
      }
      const randomIndex = Math.floor(Math.random() * songs.length);
      return NextResponse.json(songs[randomIndex]);
    }
    
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Filter songs based on search query
    const filteredSongs = songs.filter(song => 
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
    );

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSongs = filteredSongs.slice(startIndex, endIndex);

    // Return only necessary fields for the list view
    const songsList = paginatedSongs.map(({ title, artist }) => ({
      title,
      artist
    }));

    return NextResponse.json({
      songs: songsList,
      total: filteredSongs.length,
      page,
      totalPages: Math.ceil(filteredSongs.length / limit)
    });
  } catch (error) {
    console.error('Error loading songs:', error);
    return NextResponse.json(
      { error: 'Failed to load songs' },
      { status: 500 }
    );
  }
}

// Endpoint to get a single song's full details
export async function POST(request) {
  try {
    const { title } = await request.json();
    const songs = loadSongs();
    
    const song = songs.find(s => s.title === title);
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error loading song:', error);
    return NextResponse.json(
      { error: 'Failed to load song' },
      { status: 500 }
    );
  }
} 