const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  // Parse order using Gemini AI
  async parseOrderFromMessage(userMessage, availableDishes) {
    try {
      if (!this.apiKey) {
        console.log('⚠️ Gemini API key not found, falling back to simple parsing');
        return null;
      }

      // Create dish list for context
      const dishList = availableDishes.map(dish => 
        `${dish.name} - ₹${dish.price}`
      ).join('\n');

      const prompt = `
You are an AI assistant for OrderEase restaurant. Parse the customer's order message and extract dish names and quantities.

Available dishes:
${dishList}

Customer message: "${userMessage}"

Rules:
1. Only extract dishes that exist in the available dishes list
2. Extract quantities (numbers) associated with each dish
3. Match dish names even if customer uses variations (e.g., "pizza" matches "Pizza", "coke" matches "Coke")
4. If no quantity is specified, assume 1
5. Ignore words that don't relate to food orders

Return ONLY a JSON array in this exact format:
[
  {"name": "Pizza", "quantity": 2},
  {"name": "Coke", "quantity": 1}
]

If no valid dishes are found, return: []
`;

      const response = await axios.post(
        `${this.baseURL}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini response:', generatedText);

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('⚠️ No valid JSON found in Gemini response');
        return null;
      }

      const parsedItems = JSON.parse(jsonMatch[0]);
      
      // Validate and enrich with price data
      const validItems = [];
      for (const item of parsedItems) {
        const dish = availableDishes.find(d => 
          d.name.toLowerCase() === item.name.toLowerCase()
        );
        
        if (dish && item.quantity > 0) {
          validItems.push({
            name: dish.name,
            quantity: parseInt(item.quantity),
            price: dish.price
          });
        }
      }

      console.log('✅ Gemini parsed items:', validItems);
      return validItems;

    } catch (error) {
      console.error('❌ Gemini API error:', error.response?.data || error.message);
      return null;
    }
  }

  // Fallback simple parsing (existing logic)
  static simpleParseOrder(messageBody, availableDishes) {
    try {
      const orderItems = [];
      const words = messageBody.toLowerCase().split(/\s+/);
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Check if current word is a number
        const quantity = parseInt(word);
        if (isNaN(quantity) || quantity <= 0) continue;
        
        // Look for dish names in the next few words
        for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
          const potentialDishName = words.slice(i + 1, j + 1).join(' ');
          
          // Find matching dish
          const matchingDish = availableDishes.find(dish => 
            dish.name.toLowerCase().includes(potentialDishName) ||
            potentialDishName.includes(dish.name.toLowerCase())
          );
          
          if (matchingDish) {
            // Check if this item is already in the order
            const existingItem = orderItems.find(item => item.name === matchingDish.name);
            if (existingItem) {
              existingItem.quantity += quantity;
            } else {
              orderItems.push({
                name: matchingDish.name,
                quantity: quantity,
                price: matchingDish.price
              });
            }
            break;
          }
        }
      }

      console.log('🔧 Simple parsing result:', orderItems);
      return orderItems;
    } catch (error) {
      console.error('Error in simple parsing:', error);
      return [];
    }
  }

  // Main parsing function with fallback
  async parseOrder(userMessage, availableDishes) {
    console.log(`🔍 Parsing order: "${userMessage}"`);
    
    // Try Gemini first
    const geminiResult = await this.parseOrderFromMessage(userMessage, availableDishes);
    
    if (geminiResult && geminiResult.length > 0) {
      console.log('✅ Using Gemini parsing result');
      return geminiResult;
    }
    
    // Fallback to simple parsing
    console.log('🔧 Falling back to simple parsing');
    return GeminiService.simpleParseOrder(userMessage, availableDishes);
  }

  // Test Gemini connection
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      const response = await axios.post(
        `${this.baseURL}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: 'Hello, respond with just "OK" if you can understand this message.'
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.candidates[0].content.parts[0].text;
      return { success: true, response: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }
}

module.exports = GeminiService;