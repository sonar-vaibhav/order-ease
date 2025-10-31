const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent';
  }

  // Parse order using Gemini AI with natural language understanding
  async parseOrderFromMessage(userMessage, availableDishes, conversationContext = '') {
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
You are an AI assistant for OrderEase restaurant. Parse the customer's food order message naturally.

Available dishes:
${dishList}

${conversationContext ? `Previous conversation context: ${conversationContext}` : ''}

Customer message: "${userMessage}"

Parse this message and extract food items with quantities. Be flexible with language:
- "2 pizza 1 coke" = 2 Pizza, 1 Coke
- "pizza and coke" = 1 Pizza, 1 Coke  
- "I want two burgers" = 2 Burger
- "give me pizza" = 1 Pizza
- "one more pizza" = 1 Pizza (additional)

Rules:
1. Match dish names flexibly (pizza = Pizza, burger = Burger, etc.)
2. Extract quantities from numbers or words (two = 2, one = 1)
3. If no quantity specified, assume 1
4. Only include dishes from the available menu
5. Ignore non-food words

Return ONLY a JSON array:
[
  {"name": "Pizza", "quantity": 2},
  {"name": "Coke", "quantity": 1}
]

If no valid dishes found, return: []
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
      console.log('🤖 Gemini order parsing:', generatedText);

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\[[\s\S]*?\]/);
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

  // Parse customer details with flexible format
  async parseCustomerDetails(userMessage) {
    try {
      if (!this.apiKey) {
        return this.simpleParseCustomerDetails(userMessage);
      }

      const prompt = `
Parse customer details from this message. Be flexible with format:

Message: "${userMessage}"

Extract name, phone, and address. Handle various formats:
- "John Doe, 9876543210, 123 Main St"
- "John Doe 9876543210 123 Main St" 
- "Name: John, Phone: 9876543210, Address: 123 Main St"
- "John Doe\n9876543210\n123 Main St"

Return ONLY JSON:
{
  "name": "John Doe",
  "phone": "9876543210", 
  "address": "123 Main St"
}

If any field is missing, return null for that field.
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
      console.log('🤖 Gemini customer parsing:', generatedText);

      const jsonMatch = generatedText.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        return this.simpleParseCustomerDetails(userMessage);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;

    } catch (error) {
      console.error('❌ Gemini customer parsing error:', error);
      return this.simpleParseCustomerDetails(userMessage);
    }
  }

  // Fallback simple customer details parsing
  simpleParseCustomerDetails(message) {
    // Try comma-separated format first
    const commaParts = message.split(',').map(part => part.trim());
    if (commaParts.length >= 3) {
      return {
        name: commaParts[0],
        phone: commaParts[1],
        address: commaParts.slice(2).join(', ')
      };
    }

    // Try space-separated format
    const words = message.trim().split(/\s+/);
    const phoneRegex = /^\d{10,12}$/;
    
    let name = '';
    let phone = '';
    let address = '';
    let phoneIndex = -1;

    // Find phone number
    for (let i = 0; i < words.length; i++) {
      if (phoneRegex.test(words[i])) {
        phone = words[i];
        phoneIndex = i;
        break;
      }
    }

    if (phoneIndex > 0) {
      name = words.slice(0, phoneIndex).join(' ');
      address = words.slice(phoneIndex + 1).join(' ');
    }

    return { name, phone, address };
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