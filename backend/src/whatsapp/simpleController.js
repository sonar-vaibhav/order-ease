const SimpleOrderBot = require('./simpleOrderBot');
const WhatsAppOrder = require('../models/WhatsAppOrder');

class SimpleWhatsAppController {
  // Webhook verification
  static async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ WhatsApp webhook verified');
        return res.status(200).send(challenge);
      }
      
      return res.status(403).send('Forbidden');
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  }

  // Handle incoming messages
  static async handleIncomingMessage(req, res) {
    try {
      const body = req.body;
      
      if (!body.entry || !body.entry[0] || !body.entry[0].changes) {
        return res.status(200).send('OK');
      }

      const changes = body.entry[0].changes[0];
      if (!changes.value || !changes.value.messages) {
        return res.status(200).send('OK');
      }

      const message = changes.value.messages[0];
      const from = message.from;
      const messageBody = message.text?.body;

      if (!messageBody) {
        return res.status(200).send('OK');
      }

      console.log(`📱 Message from ${from}: "${messageBody}"`);

      // Check if user has pending order waiting for details
      const pendingOrder = await WhatsAppOrder.findOne({
        phoneNumber: from,
        status: 'pending_details'
      });

      console.log(`🔍 Pending order for ${from}:`, pendingOrder ? 'Found' : 'Not found');

      if (pendingOrder) {
        console.log(`📝 Handling customer details for ${from}`);
        // Handle customer details
        await SimpleOrderBot.handleCustomerDetails(from, messageBody);
      } else {
        console.log(`💬 Handling normal message for ${from}`);
        // Handle normal message
        await SimpleOrderBot.handleMessage(from, messageBody);
      }

      return res.status(200).send('OK');

    } catch (error) {
      console.error('Error handling message:', error);
      return res.status(500).json({ error: 'Failed to process message' });
    }
  }
}

module.exports = SimpleWhatsAppController;