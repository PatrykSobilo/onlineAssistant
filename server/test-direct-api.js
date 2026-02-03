require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testDirectAPI() {
  console.log('Testing direct API call to v1 endpoint...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{
        text: "Hello, test"
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
      console.log('✅ SUCCESS with v1 endpoint!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED with v1 endpoint');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectAPI();
