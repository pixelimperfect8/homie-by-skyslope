import OpenAI from 'openai';

// Use the OpenAI API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // This is required for React Native
});

export async function generateResponse(messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Use gpt-3.5-turbo for a more cost-effective option
      messages,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.',
      isError: false,
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      content: 'Sorry, there was an error generating a response. Please try again later.',
      isError: true,
    };
  }
}