import { NextResponse } from 'next/server';
import Freeplay, { getCallInfo } from 'freeplay/thin';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const fpClient = new Freeplay({
  freeplayApiKey: process.env.FREEPLAY_API_KEY,
  baseUrl: "https://app.freeplay.ai/api"
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This POST endpoint analyzes song lyrics using OpenAI and Freeplay.
// It takes lyrics and an optional title as input, formats them using a Freeplay prompt template,
// sends the formatted prompt to OpenAI for analysis, and logs the results to Freeplay.
// The response is returned as a JSON object containing the analysis.
export async function POST(req) {
  try {
    const { lyrics, title } = await req.json();
    console.log('Freeplay mode - Received request:', { title, lyricLength: lyrics?.length });

    if (!lyrics) {
      return NextResponse.json(
        { error: 'No lyrics provided' },
        { status: 400 }
      );
    }

    console.log('Freeplay mode - Getting formatted prompt...');
    const promptVars = {
      title: title || 'Untitled',
      lyrics
    };

    console.log('Freeplay mode - projectId:', process.env.FREEPLAY_PROJECT_ID);

    let formattedPrompt = await fpClient.prompts.getFormatted({
      projectId: process.env.FREEPLAY_PROJECT_ID,
      templateName: "song_analyzer",
      environment: process.env.FREEPLAY_ENVIRONMENT,
      variables: promptVars,
    });

    console.log('Freeplay mode - Formatted prompt received:', formattedPrompt);

    console.log('Freeplay mode - Making OpenAI call...');
    const start = new Date();
    try {
      const completion = await openai.chat.completions.create({
        messages: formattedPrompt.llmPrompt,
        model: formattedPrompt.promptInfo.model,
        ...formattedPrompt.promptInfo.modelParameters,
        response_format: { type: "json_object" }
      });

      const end = new Date();
      const content = completion.choices[0].message.content;
      
      // Update messages with the response
      const messages = formattedPrompt.allMessages({
        role: completion.choices[0].message.role,
        content
      });

      // Create session and completion IDs
      const sessionId = uuidv4();
      const completionId = uuidv4();

      console.log('Freeplay mode - Logging results to Freeplay...');
      // Log the results asynchronously to Freeplay
      fpClient.recordings.create({
        allMessages: messages,
        inputs: promptVars,
        sessionInfo: {
          sessionId,
          customMetadata: { title }
        },
        completionId,
        promptInfo: formattedPrompt.promptInfo,
        callInfo: getCallInfo(formattedPrompt.promptInfo, start, end),
        responseInfo: {
          isComplete: completion.choices[0].finish_reason === 'stop'
        }
      }).then(() => {
        console.log('Freeplay mode - Successfully logged to Freeplay');
      }).catch(error => {
        console.error('Freeplay mode - Failed to record to Freeplay:', error);
      });

      try {
        const parsedResult = JSON.parse(content);
        return NextResponse.json({ 
          result: parsedResult,
          rawOutput: content
        });
      } catch (parseError) {
        console.error('Freeplay mode - JSON parsing error:', parseError);
        console.error('Freeplay mode - Raw output that failed to parse:', content);
        return NextResponse.json(
          { 
            error: 'Failed to parse AI response into JSON',
            details: parseError.message,
            rawOutput: content
          },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error('Freeplay mode - API call error:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to get response from OpenAI API',
          details: apiError.message,
          stack: process.env.NODE_ENV === 'development' ? apiError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (requestError) {
    console.error('Freeplay mode - Request processing error:', requestError);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: requestError.message,
        stack: process.env.NODE_ENV === 'development' ? requestError.stack : undefined
      },
      { status: 500 }
    );
  }
} 