const WhatsAppService = require('./whatsappService');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const WhatsAppOrder = require('../models/WhatsAppOrder');
const moment = require('moment-timezone');

class WhatsAppController {
  // Webhook verification for WhatsApp Cloud API
  static async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified successfully');
        return res.status(200).send(challenge);
      }
      
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
      
      // Verify webhook signature (optional but recommended)
      if (!body.entry || !body.entry[0] || !body.entry[0].changes) {
        return res.status(200).send('OK');
      }

      const changes = body.entry[0].changes[0];
      if (!changes.value || !changes.value.messages) {
        return res.status(200).send('OK');
      }

      const message = changes.value.messages[0];
      const from = message.from;
      const messageBody = message.text?.body?.toLowerCase().trim();
      const messageId = message.id;

      console.log(`Received message from ${from}: ${messageBody}`);

      // Process the message
      await WhatsAppController.processMessage(from, messageBody, messageId);

      return res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling incoming message:', error);
      return res.status(500).json({ error: 'Failed to process message' });
    }
  }

  // Process different types of messages
  static async processMessage(phoneNumber, messageBody, messageId) {
    try {
      // Check if it's a tracking request
      if (messageBody.includes('track') || messageBody.match(/^\d{8}-\d{3}$/)) {
        await WhatsAppController.handleTrackingRequest(phoneNumber, messageBody);
        return;
      }

      // Check if it's a menu request
      if (messageBody.includes('menu') || messageBody.includes('list')) {
        await WhatsAppController.sendMenu(phoneNumber);
        return;
      }

      // Check if user has a pending order waiting for details
      const pendingOrder = await WhatsAppOrder.findPendingOrder(phoneNumber);
      if (pendingOrder && pendingOrder.status === 'pending_details') {
        await WhatsAppController.handleCustomerDetails(phoneNumber, messageBody);
        return;
      }

      // Check if it's an order request
      if (messageBody.includes('order') || messageBody.includes('want')) {
        await WhatsAppController.handleOrderRequest(phoneNumber, messageBody);
        return;
      }

      // Default response for unrecognized messages
      await WhatsAppController.sendDefaultResponse(phoneNumber);
    } catch (error) {
      console.error('Error processing message:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error processing your request. Please try again later.'
      );
    }
  }

  // Handle order tracking requests
  static async handleTrackingRequest(phoneNumber, messageBody) {
    try {
      let orderId = null;

      // Extract order ID from message
      const orderIdMatch = messageBody.match(/(\d{8}-\d{3})/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
      } else if (messageBody.includes('track')) {
        // Ask for order ID
        await WhatsAppService.sendMessage(
          phoneNumber,
          '🔍 Please provide your Order ID to track your order.\n\nExample: 20241031-001'
        );
        return;
      }

      if (!orderId) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ Invalid Order ID format. Please provide a valid Order ID (e.g., 20241031-001)'
        );
        return;
      }

      // Find order in database
      const order = await Order.findOne({ displayOrderId: orderId });
      if (!order) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          `❌ Order ${orderId} not found. Please check your Order ID and try again.`
        );
        return;
      }

      // Send order status
      const statusEmoji = {
        'queued': '⏳',
        'preparing': '👨‍🍳',
        'ready': '✅',
        'picked': '📦'
      };

      const statusText = {
        'queued': 'Order Received - In Queue',
        'preparing': 'Being Prepared',
        'ready': 'Ready for Pickup',
        'picked': 'Order Completed'
      };

      let message = `${statusEmoji[order.status]} *Order Status: ${statusText[order.status]}*\n\n`;
      message += `📋 Order ID: ${order.displayOrderId}\n`;
      message += `👤 Customer: ${order.customer.name}\n`;
      message += `📞 Phone: ${order.customer.phone}\n\n`;
      
      message += `🍽️ *Items:*\n`;
      order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
      });

      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      message += `\n💰 Total: ₹${totalAmount}\n`;

      if (order.timeRequired && order.status === 'preparing') {
        message += `⏱️ Estimated time: ${order.timeRequired} minutes\n`;
      }

      message += `📅 Ordered: ${moment(order.createdAt).tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm A')}`;

      await WhatsAppService.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error handling tracking request:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error tracking your order. Please try again later.'
      );
    }
  }

  // Send menu to customer
  static async sendMenu(phoneNumber) {
    try {
      const dishes = await Dish.find({ available: true }).sort({ name: 1 });
      
      if (dishes.length === 0) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ Sorry, no items are currently available. Please try again later.'
        );
        return;
      }

      let menuMessage = '🍽️ *OrderEase Menu*\n\n';
      dishes.forEach((dish, index) => {
        menuMessage += `${index + 1}. *${dish.name}* - ₹${dish.price}\n`;
        if (dish.description) {
          menuMessage += `   ${dish.description}\n`;
        }
        menuMessage += '\n';
      });

      menuMessage += '📝 *To place an order, reply with:*\n';
      menuMessage += 'Example: "I want 2 Pizza and 1 Coke"\n\n';
      menuMessage += '📞 Need help? Just ask!';

      await WhatsAppService.sendMessage(phoneNumber, menuMessage);
    } catch (error) {
      console.error('Error sending menu:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error fetching the menu. Please try again later.'
      );
    }
  }

  // Handle order requests
  static async handleOrderRequest(phoneNumber, messageBody) {
    try {
      // Parse order from message
      const orderItems = await WhatsAppController.parseOrderFromMessage(messageBody);
      
      if (orderItems.length === 0) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ Could not understand your order. Please try again.\n\n' +
          '📝 Example: "I want 2 Pizza and 1 Coke"\n\n' +
          'Type "menu" to see available items.'
        );
        return;
      }

      // Calculate total amount
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order confirmation message
      let confirmationMessage = '🛒 *Order Summary*\n\n';
      orderItems.forEach(item => {
        confirmationMessage += `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
      });
      confirmationMessage += `\n💰 *Total: ₹${totalAmount}*\n\n`;
      confirmationMessage += '📝 Please provide your details:\n';
      confirmationMessage += 'Reply with: Name, Phone, Address\n';
      confirmationMessage += 'Example: "John Doe, 9876543210, 123 Main St"';

      // Store pending order
      const pendingOrder = new WhatsAppOrder({
        phoneNumber,
        items: orderItems,
        totalAmount,
        status: 'pending_details',
        messageHistory: [{
          type: 'order_request',
          content: messageBody,
          timestamp: new Date()
        }]
      });
      await pendingOrder.save();

      await WhatsAppService.sendMessage(phoneNumber, confirmationMessage);
    } catch (error) {
      console.error('Error handling order request:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error processing your order. Please try again later.'
      );
    }
  }

  // Parse order items from message text
  static async parseOrderFromMessage(messageBody) {
    try {
      const dishes = await Dish.find({ available: true });
      const orderItems = [];

      // Simple parsing logic - look for patterns like "2 pizza", "1 coke", etc.
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
          const matchingDish = dishes.find(dish => 
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

      return orderItems;
    } catch (error) {
      console.error('Error parsing order from message:', error);
      return [];
    }
  }

  // Send default response for unrecognized messages
  static async sendDefaultResponse(phoneNumber) {
    const message = `👋 Welcome to *OrderEase*!\n\n` +
      `🍽️ Type "menu" to see our menu\n` +
      `📝 Type "I want [items]" to place an order\n` +
      `🔍 Type "track [OrderID]" to track your order\n\n` +
      `Example: "I want 2 Pizza and 1 Coke"\n\n` +
      `Need help? Just ask! 😊`;

    await WhatsAppService.sendMessage(phoneNumber, message);
  }

  // Handle customer details for pending orders
  static async handleCustomerDetails(phoneNumber, messageBody) {
    try {
      // Find pending order
      const pendingOrder = await WhatsAppOrder.findOne({
        phoneNumber,
        status: 'pending_details'
      }).sort({ createdAt: -1 });

      if (!pendingOrder) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ No pending order found. Please place a new order.'
        );
        return;
      }

      // Parse customer details (Name, Phone, Address)
      const parts = messageBody.split(',').map(part => part.trim());
      if (parts.length < 3) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ Please provide complete details in format:\n' +
          'Name, Phone, Address\n\n' +
          'Example: "John Doe, 9876543210, 123 Main St"'
        );
        return;
      }

      const [name, phone, address] = parts;

      // Update pending order with customer details
      pendingOrder.customer = { name, phone, address };
      pendingOrder.status = 'pending_payment';
      await pendingOrder.save();

      // Create Razorpay payment link
      const paymentLink = await WhatsAppController.createPaymentLink(
        pendingOrder.totalAmount,
        pendingOrder._id.toString()
      );

      // Send payment link
      const paymentMessage = `✅ *Order Confirmed!*\n\n` +
        `👤 Name: ${name}\n` +
        `📞 Phone: ${phone}\n` +
        `📍 Address: ${address}\n\n` +
        `💰 Total Amount: ₹${pendingOrder.totalAmount}\n\n` +
        `💳 *Complete your payment:*\n` +
        `${paymentLink}\n\n` +
        `⚠️ This is a test payment link. Use test card details.`;

      await WhatsAppService.sendMessage(phoneNumber, paymentMessage);
    } catch (error) {
      console.error('Error handling customer details:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error processing your details. Please try again.'
      );
    }
  }

  // Create Razorpay payment link
  static async createPaymentLink(amount, orderId) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const paymentLink = await razorpay.paymentLink.create({
        amount: amount * 100, // amount in paise
        currency: 'INR',
        accept_partial: false,
        description: `OrderEase - Order Payment`,
        customer: {
          name: 'OrderEase Customer',
        },
        notify: {
          sms: false,
          email: false,
          whatsapp: false
        },
        reminder_enable: false,
        notes: {
          whatsapp_order_id: orderId,
          source: 'whatsapp'
        },
        callback_url: `${process.env.BACKEND_URL}/api/whatsapp/payment-success`,
        callback_method: 'get'
      });

      return paymentLink.short_url;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppController;