const { tavily } = require('@tavily/core');

exports.searchWeb = async (query) => {
  try {
    console.log('🔍 Searching web for:', query);
    
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey || apiKey === 'your-tavily-api-key-here') {
      console.warn('⚠️ Tavily API key not configured, search disabled');
      return [];
    }
    
    // Initialize Tavily client
    const tvly = tavily({ apiKey });
    
    // Search with Tavily
    const response = await tvly.search(query, {
      searchDepth: 'basic', // or 'advanced' for deeper search
      maxResults: 5
    });
    
    // Extract results
    const results = response.results.map(item => ({
      title: item.title,
      description: item.content || item.snippet || '',
      url: item.url
    }));
    
    console.log(`✅ Found ${results.length} real-time search results from Tavily`);
    return results;
    
  } catch (error) {
    console.error('❌ Web search error:', error.message);
    return []; // Return empty array on error, don't crash
  }
};
