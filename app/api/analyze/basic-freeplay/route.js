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

export async function POST(req) {
  try {
    const { lyrics, title } = await req.json();
    console.log('Basic-Freeplay mode - Received request:', { title, lyricLength: lyrics?.length });

    if (!lyrics) {
      return NextResponse.json(
        { error: 'No lyrics provided' },
        { status: 400 }
      );
    }

    console.log('Basic-Freeplay mode - Getting formatted prompt...');
    const promptVars = {
      title: title || 'Untitled',
      lyrics
    };

    console.log('Basic-Freeplay mode - projectId:', process.env.FREEPLAY_PROJECT_ID);

    let formattedPrompt = await fpClient.prompts.getFormatted({
      projectId: process.env.FREEPLAY_PROJECT_ID,
      templateName: "song_kid_friendly_basic",
      environment: process.env.FREEPLAY_ENVIRONMENT,
      variables: promptVars,
    });

    console.log('Basic-Freeplay mode - Formatted prompt received:', formattedPrompt);

    console.log('Basic-Freeplay mode - Making OpenAI call...');
    const start = new Date();
    try {
      const completion = await openai.chat.completions.create({
        messages: formattedPrompt.llmPrompt,
        model: formattedPrompt.promptInfo.model,
        ...formattedPrompt.promptInfo.modelParameters
      });

      const end = new Date();
      const content = completion.choices[0].message.content.trim();
      console.log('Basic-Freeplay mode - OpenAI response content:', content);

      // Check if the response is a simple TRUE/FALSE
      if (content === 'TRUE' || content === 'FALSE') {
        return NextResponse.json({ result: content });
      }

      // Update messages with the response
      const messages = formattedPrompt.allMessages({
        role: completion.choices[0].message.role,
        content
      });

      // Create session and completion IDs
      const sessionId = uuidv4();
      const completionId = uuidv4();

      console.log('Basic-Freeplay mode - Logging results to Freeplay...');
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
        console.log('Basic-Freeplay mode - Successfully logged to Freeplay');
      }).catch(error => {
        console.error('Basic-Freeplay mode - Failed to record to Freeplay:', error);
      });

      try {
        const parsedResult = JSON.parse(content);
        return NextResponse.json({ 
          result: parsedResult,
          rawOutput: content
        });
      } catch (parseError) {
        console.error('Basic-Freeplay mode - JSON parsing error:', parseError);
        console.error('Basic-Freeplay mode - Raw output that failed to parse:', content);
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
      console.error('Basic-Freeplay mode - API call error:', apiError);
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
    console.error('Basic-Freeplay mode - Request processing error:', requestError);
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