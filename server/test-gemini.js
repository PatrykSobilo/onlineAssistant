import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!apiKey);
console.log('API Key length:', apiKey?.length);

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log('\n=== Listing available models ===\n');
    
    // This will show us what models are available
    const models = await genAI.listModels();
    
    console.log('Available models:');
    for (const model of models) {
      console.log(`\nModel: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
    
    // Try a simple test with common model names
    console.log('\n=== Trying common model names ===\n');
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest',
      'text-bison-001',
      'chat-bison-001'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`Response: ${response.text()}`);
        break; // Stop after first working model
      } catch (err) {
        console.log(`❌ ${modelName} failed: ${err.message}`);
      }
    }
  }
}

listModels();
