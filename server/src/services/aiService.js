import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchWeb } from './searchService.js';

export const chatWithAI = async (userMessage) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('GEMINI_API_KEY not configured. Please add your API key to .env file');
    }

    console.log('Using API Key:', apiKey ? 'Key present (length: ' + apiKey.length + ')' : 'Key missing');

    // Initialize with API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash model (available and free)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });

    // Check if user is asking for current/real-time information
    const needsSearch = /\b(current|latest|today|now|recent|what is|weather|news|price)\b/i.test(userMessage);
    
    let prompt = userMessage;
    
    if (needsSearch) {
      console.log('User needs real-time info, searching web...');
      try {
        const searchResults = await searchWeb(userMessage);
        
        // Add search results to the prompt
        const searchContext = searchResults.map((result, idx) => 
          `[${idx + 1}] ${result.title}\n${result.description}\nSource: ${result.url}`
        ).join('\n\n');
        
        prompt = `User question: ${userMessage}

Here are some recent search results that might help answer this question:

${searchContext}

Please use the above information to provide an accurate, up-to-date answer. Cite your sources when relevant.`;
        
        console.log('Added search context to prompt');
      } catch (searchError) {
        console.error('Search failed, continuing without web data:', searchError.message);
      }
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('AI Chat Error:', error.message || error);
    throw error;
  }
};
