const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log('Sprawdzam dostępne modele...\n');
  
  try {
    // Metoda listModels() powinna zwrócić listę dostępnych modeli
    const models = await genAI.listModels();
    console.log('✅ Dostępne modele:');
    models.forEach(model => {
      console.log(`  - ${model.name}`);
      console.log(`    Opis: ${model.description || 'Brak opisu'}`);
      console.log(`    Obsługiwane metody: ${model.supportedGenerationMethods?.join(', ') || 'Brak info'}\n`);
    });
  } catch (error) {
    console.error('❌ Błąd podczas listowania modeli:', error.message);
    console.error('\nPełny błąd:', error);
  }
}

listModels();
