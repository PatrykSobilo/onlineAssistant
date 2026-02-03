require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  console.log('Checking available models via ListModels API...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Available models:');
      if (data.models && data.models.length > 0) {
        data.models.forEach(model => {
          console.log(`\n📦 ${model.name}`);
          console.log(`   Display Name: ${model.displayName || 'N/A'}`);
          console.log(`   Description: ${model.description || 'N/A'}`);
          console.log(`   Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        });
      } else {
        console.log('No models found');
      }
    } else {
      console.log('❌ FAILED to list models');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
