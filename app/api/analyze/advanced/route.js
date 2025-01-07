import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { lyrics } = await req.json();

    if (!lyrics) {
      return NextResponse.json(
        { error: 'No lyrics provided' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a music analyst. Analyze the given lyrics and provide information about the genre, whether it contains explicit content, and a brief summary of the song's meaning. Be thorough but concise."
        },
        {
          role: "user",
          content: `Please analyze these lyrics and provide: 1) The most likely genre 2) Whether it contains explicit content 3) A brief summary of what the song means:\n\n${lyrics}`
        }
      ],
      model: "gpt-3.5-turbo",
    });

    const analysis = completion.choices[0].message.content;
    
    // Parse the response into structured data
    // You might want to make this parsing more robust
    const genreMatch = analysis.match(/genre:?\s*([^.!?\n]+)/i);
    const explicitMatch = analysis.match(/explicit:?\s*([^.!?\n]+)/i);
    const summaryMatch = analysis.match(/summary:?\s*([^.!?\n]+)/i);

    const result = {
      genre: genreMatch ? genreMatch[1].trim() : 'Unknown',
      explicit: explicitMatch ? explicitMatch[1].toLowerCase().includes('yes') : false,
      summary: summaryMatch ? summaryMatch[1].trim() : 'Unable to determine meaning',
    };

    return NextResponse.json({ 
      result,
      rawOutput: analysis
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lyrics' },
      { status: 500 }
    );
  }
} 