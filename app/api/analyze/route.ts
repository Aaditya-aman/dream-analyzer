import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  console.log('API route: analyze dream request received');
  try {
    const { dream, emotions } = await request.json();
    console.log('API route: processing dream', { dreamLength: dream.length, emotions });
    
    // Configure the model with safety settings
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    //const prompt = `Analyze this dream and provide insights about its potential meaning in less than 50 words. Consider these emotions the dreamer felt: ${emotions.join(', ')}\n\nDream: ${dream}`;
    
const prompt = `I had a dream, and I want to understand its meaning. Here is my dream description: ${dream}.Analyze this dream using different psychological and symbolic approaches, such as: 1. Freudian analysis (unconscious desires and repressed thoughts) 2.Jungian analysis (archetypes and collective unconscious symbols) 3.Cognitive approach (how the dream relates to recent experiences and thoughts) 4.Spiritual or cultural interpretations (common symbolic meanings in different traditions). Additionally, consider the emotions I felt during the dream: ${emotions.join(', ')} . Provide a structured interpretation that includes: 1. Possible meanings based on the different approaches. 2. Common dream symbols and their significance. 3. How this dream might relate to my current life situation or mental state. 4. Any advice or reflection points based on the interpretation. Give output in 70 words only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('API route: analysis generated successfully');

    // Get user session from cookies
    console.log('API route: checking user authentication');
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // This is a read-only handler
          },
          remove(name: string, options: any) {
            // This is a read-only handler
          },
        },
      }
    );

    // Check if user is authenticated 
    const { data: { session } } = await supabase.auth.getSession();
    console.log('API route: user session status:', session ? 'authenticated' : 'not authenticated');
    
    // We're removing the database save from here since it's already handled in the client page
    // This prevents duplicate entries
    
    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error('Dream analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dream' },
      { status: 500 }
    );
  }
}