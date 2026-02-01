const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chatWithAI = async (userMessage) => {
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

    // Generate response
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('AI Chat Error:', error.message || error);
    throw error;
  }
};
