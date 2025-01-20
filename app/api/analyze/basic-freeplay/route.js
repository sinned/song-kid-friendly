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

    if (!lyrics) {
      return NextResponse.json(
        { error: 'No lyrics provided' },
        { status: 400 }
      );
    }

    const promptVars = {
      title: title || 'Untitled',
      lyrics
    };

    const formattedPrompt = await fpClient.prompts.getFormatted({
      projectId: process.env.FREEPLAY_PROJECT_ID,
      templateName: "song_kid_friendly_basic",
      environment: "latest",
      variables: promptVars,
    });

    const start = new Date();
    const completion = await openai.chat.completions.create({
      messages: formattedPrompt.llmPrompt,
      model: formattedPrompt.promptInfo.model,
      ...formattedPrompt.promptInfo.modelParameters,
      temperature: 0.1,
      max_tokens: 10
    });
    const end = new Date();

    const content = completion.choices[0].message.content.trim().toUpperCase();
    const validResults = ['TRUE', 'FALSE'];
    const result = validResults.includes(content) ? content : 'FALSE';

    // Update messages with response
    const messages = formattedPrompt.allMessages({
      role: completion.choices[0].message.role,
      content: result
    });

    // Record to Freeplay
    const sessionId = uuidv4();
    const completionId = uuidv4();

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
    }).catch(error => {
      console.error('Failed to record to Freeplay:', error);
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message, result: 'FALSE' },
      { status: 500 }
    );
  }
} 