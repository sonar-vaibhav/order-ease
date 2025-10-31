const axios = require('axios');

// Test WhatsApp token directly
async function testWhatsAppToken() {
  const phoneNumberId = '833339916533428';
  const accessToken = 'EAAMT8OZBPzCsBP5z17WiIqCXZApfhSbZCrSkjVw8ECnhYmpNe3IZApVbtyfc8N9oNSyWQFxAedJqSu5qX105Ccb9cftkDIz6zDysBY85pDANzsfWiQjirQWZCdgVbU2Esgs6i2TUkHD59m5a5sKQGuREH5TWC4ZBenzwz4vgXbTJzo5rVkm7iZCSKgLpWqyGKS5FPugzkcZCjs7O9j2iWuKz8C8vevnXjgYnydXQrMDEpgIAMdK8KfSF4L7diNclsgTHtTRlUlZAUoB1wFZAYdZCaaZCqqsZD';

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '917498780950',
        type: 'text',
        text: {
          body: '🧪 Direct token test - if you receive this, the token works!'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Token works! Message sent:', response.data);
  } catch (error) {
    console.log('❌ Token failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Token is expired or invalid - get a new one from Meta console');
    }
  }
}

testWhatsAppToken();