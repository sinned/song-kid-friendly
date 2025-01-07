// pages/api/analyze.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lyrics } = req.body;

  if (!lyrics) {
    return res.status(400).json({ error: 'Lyrics are required' });
  }

  try {
    const prompt = `Act as an expert song analyst. Given a song and its lyrics, your job is to evaluate the song if it is appropriate for inclusion in a kid-friendly song library. Your output is one of two words only: TRUE, FALSE or UNKNOWN ONLY output ONE WORD.\n\nLyrics:\n${lyrics}\n\nOutput:`;

    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 10,
      temperature: 0.3,
    });

    const result = completion.data.choices[0].text.trim();
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error analyzing lyrics', result: 'UNKNOWN' });
  }
}
