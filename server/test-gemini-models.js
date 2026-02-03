const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key:', apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Missing');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];
    
    for (const modelName of modelsToTry) {
      console.log(`\n🧪 Testing model: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, reply with "Hi"');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}`);
        console.log(`Response: ${text.substring(0, 100)}`);
        break; // Stop after first success
      } catch (error) {
        console.log(`❌ FAILED with ${modelName}: ${error.message.substring(0, 150)}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testModels();
