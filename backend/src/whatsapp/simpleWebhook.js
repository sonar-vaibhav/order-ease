const axios = require('axios');

class SimpleWhatsAppWebhook {
  // Webhook verification for WhatsApp Cloud API
  static async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('Webhook verification attempt:', { mode, token, challenge });

      // Check if the verify token matches
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ WhatsApp webhook verified successfully');
        return res.status(200).send(challenge);
      }
      
      console.log('❌ Webhook verification failed - token mismatch');
      return res.status(403).send('Forbidden');
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  }

  // Handle incoming WhatsApp messages
  static async handleIncomingMessage(req, res) {
    try {
      const body = req.body;
      console.log('📨 Received webhook payload:', JSON.stringify(body, null, 2));
      
      // Check if this is a valid WhatsApp message webhook
      if (!body.entry || !body.entry[0] || !body.entry[0].changes) {
        console.log('⚠️ Invalid webhook payload structure');
        return res.status(200).send('OK');
      }

      const changes = body.entry[0].changes[0];
      if (!changes.value || !changes.value.messages) {
        console.log('⚠️ No messages in webhook payload');
        return res.status(200).send('OK');
      }

      const message = changes.value.messages[0];
      const from = message.from;
      const messageBody = message.text?.body;
      const messageId = message.id;

      console.log(`📱 Message received from ${from}: "${messageBody}"`);

      // Send welcome message reply
      await SimpleWhatsAppWebhook.sendWelcomeMessage(from, messageBody);

      return res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
      return res.status(500).json({ error: 'Failed to process message' });
    }
  }

  // Send welcome message to first-time users
  static async sendWelcomeMessage(phoneNumber, userMessage) {
    try {
      // Simple welcome message
      const welcomeMessage = `👋 Welcome to *OrderEase*!\n\n` +
        `Thank you for contacting us. We received your message: "${userMessage}"\n\n` +
        `🍽️ We're a restaurant order management system\n` +
        `📝 Soon you'll be able to place orders directly through WhatsApp\n` +
        `🔍 Track your orders in real-time\n\n` +
        `Stay tuned for more features! 😊`;

      const success = await SimpleWhatsAppWebhook.sendMessage(phoneNumber, welcomeMessage);
      
      if (success) {
        console.log(`✅ Welcome message sent to ${phoneNumber}`);
      } else {
        console.log(`❌ Failed to send welcome message to ${phoneNumber}`);
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  // Send message using WhatsApp Cloud API
  static async sendMessage(to, message) {
    try {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      if (!phoneNumberId || !accessToken) {
        console.error('❌ WhatsApp credentials not configured');
        return false;
      }

      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };

      console.log(`📤 Sending message to ${to}:`, message);

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Message sent successfully:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
      return false;
    }
  }

  // Test endpoint to send manual messages
  static async sendTestMessage(req, res) {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ 
          error: 'Phone number and message are required',
          example: {
            to: '919876543210',
            message: 'Hello from OrderEase!'
          }
        });
      }

      const success = await SimpleWhatsAppWebhook.sendMessage(to, message);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Test message sent successfully',
          to: to
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send test message' 
        });
      }
    } catch (error) {
      console.error('Error in test message endpoint:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }
}

module.exports = SimpleWhatsAppWebhook;