require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini25Flash() {
  console.log('Testing gemini-2.5-flash model...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{
        text: "Odpowiedz krótko: Jak masz na imię?"
      }]
    }]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS with gemini-2.5-flash!');
      console.log('Response text:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('❌ FAILED');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGemini25Flash();
