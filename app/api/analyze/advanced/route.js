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
          content: `You are a music analyst. Analyze the given lyrics and provide a JSON response with the following structure:
{
  "genre": "the most likely musical genre",
  "explicit": boolean indicating if content is explicit,
  "summary": "a brief summary of the song's meaning",
  "themes": ["array", "of", "main", "themes"],
  "mood": "overall mood of the song"
}
Ensure the response is valid JSON. Be thorough but concise in the summary.`
        },
        {
          role: "user",
          content: `Analyze these lyrics and provide the analysis in the specified JSON format:\n\n${lyrics}`
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" } // This ensures JSON output for compatible models
    });

    const rawOutput = completion.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const parsedResult = JSON.parse(rawOutput);
      
      // Return both the parsed result and raw output
      return NextResponse.json({ 
        result: parsedResult,
        rawOutput 
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lyrics' },
      { status: 500 }
    );
  }
} 