import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received lyrics:', body.lyrics);
    
    if (!body.lyrics) {
      return NextResponse.json(
        { error: 'No lyrics provided', result: 'UNKNOWN' },
        { status: 400 }
      );
    }

    console.log('Attempting OpenAI API call...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert song analyst specializing in determining if songs are kid-friendly. You MUST respond with ONLY ONE WORD: TRUE for kid-friendly songs, FALSE for non-kid-friendly songs. TRUE means the song is completely appropriate for children under 12. If you're unsure, respond with FALSE."
        },
        {
          role: "user",
          content: `Analyze these lyrics and respond with only TRUE or FALSE:\n\n${body.lyrics}`
        }
      ],
      temperature: 0.1,  // Lower temperature for more consistent responses
      max_tokens: 10,
    });

    console.log('Raw OpenAI response:', completion.choices[0].message);
    
    const result = completion.choices[0].message.content.trim().toUpperCase();
    console.log('Processed result:', result);
    
    const validResults = ['TRUE', 'FALSE'];  // Removed UNKNOWN as a valid response
    const finalResult = validResults.includes(result) ? result : 'FALSE';  // Default to FALSE if unclear
    console.log('Final result:', finalResult);

    return NextResponse.json({ result: finalResult });
    
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { 
        error: `Server error: ${error.message}`, 
        result: 'FALSE',  // Default to FALSE on errors
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}