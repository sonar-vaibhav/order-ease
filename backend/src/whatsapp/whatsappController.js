const WhatsAppService = require('./whatsappService');
const GeminiService = require('./geminiService');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const WhatsAppOrder = require('../models/WhatsAppOrder');
const ChatSession = require('../models/ChatSession');
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

  // Process different types of messages with session management
  static async processMessage(phoneNumber, messageBody, messageId) {
    try {
      const cleanMessage = messageBody.toLowerCase().trim();
      
      // Handle special commands first
      if (cleanMessage === 'quit' || cleanMessage === 'reset' || cleanMessage === 'start over') {
        await WhatsAppController.handleQuitCommand(phoneNumber);
        return;
      }

      // Handle direct order tracking (order ID format)
      if (cleanMessage.match(/^\d{8}-\d{3}$/)) {
        await WhatsAppController.handleTrackingRequest(phoneNumber, cleanMessage);
        return;
      }

      // Get or create session
      const session = await ChatSession.findOrCreateSession(phoneNumber);
      session.addMessage(messageBody, 'user');

      console.log(`📱 ${phoneNumber} [${session.stage}]: "${messageBody}"`);

      // Route based on conversation stage
      switch (session.stage) {
        case 'welcome':
          await WhatsAppController.handleWelcomeStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'browsing':
          await WhatsAppController.handleBrowsingStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'ordering':
          await WhatsAppController.handleOrderingStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'confirming_order':
          await WhatsAppController.handleOrderConfirmationStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'collecting_details':
          await WhatsAppController.handleDetailsCollectionStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'payment_pending':
          await WhatsAppController.handlePaymentPendingStage(phoneNumber, cleanMessage, session);
          break;
        
        case 'tracking':
          await WhatsAppController.handleTrackingStage(phoneNumber, cleanMessage, session);
          break;
        
        default:
          await WhatsAppController.handleWelcomeStage(phoneNumber, cleanMessage, session);
      }

      await session.save();

    } catch (error) {
      console.error('Error processing message:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        '❌ Sorry, something went wrong. Type *quit* to start fresh or try again.'
      );
    }
  }

  // Handle quit command - reset session
  static async handleQuitCommand(phoneNumber) {
    try {
      await ChatSession.clearSession(phoneNumber);
      
      const message = `🔄 *Session Reset*\n\n` +
        `Your conversation has been cleared. Starting fresh!\n\n` +
        `👋 Welcome to *OrderEase*!\n\n` +
        `🍽️ Type *menu* to see our dishes\n` +
        `📝 Just tell me what you'd like to order\n` +
        `🔍 Send an Order ID to track your order\n\n` +
        `Example: "2 pizza 1 coke" or "I want burger"\n\n` +
        `Need help? Just ask! 😊`;

      await WhatsAppService.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error handling quit command:', error);
    }
  }

  // Handle welcome stage
  static async handleWelcomeStage(phoneNumber, message, session) {
    if (message.includes('menu') || message.includes('list')) {
      await WhatsAppController.sendMenu(phoneNumber);
      session.updateStage('browsing');
    } else if (message.includes('track')) {
      await WhatsAppController.askForOrderId(phoneNumber);
      session.updateStage('tracking');
    } else if (await WhatsAppController.isOrderMessage(message)) {
      await WhatsAppController.handleOrderingStage(phoneNumber, message, session);
    } else {
      await WhatsAppController.sendWelcomeMessage(phoneNumber);
    }
  }

  // Handle browsing stage (looking at menu)
  static async handleBrowsingStage(phoneNumber, message, session) {
    if (await WhatsAppController.isOrderMessage(message)) {
      session.updateStage('ordering');
      await WhatsAppController.handleOrderingStage(phoneNumber, message, session);
    } else if (message.includes('menu')) {
      await WhatsAppController.sendMenu(phoneNumber);
    } else {
      await WhatsAppService.sendMessage(
        phoneNumber,
        `🍽️ I can help you order! Try saying:\n\n` +
        `• "2 pizza 1 coke"\n` +
        `• "I want burger"\n` +
        `• "menu" to see all dishes\n\n` +
        `What would you like to order? 😊`
      );
    }
  }

  // Handle ordering stage (building order)
  static async handleOrderingStage(phoneNumber, message, session) {
    const dishes = await Dish.find({ available: true });
    const geminiService = new GeminiService();
    
    // Get conversation context
    const context = session.context.messageHistory
      .slice(-3)
      .map(msg => `${msg.type}: ${msg.message}`)
      .join('\n');

    const orderItems = await geminiService.parseOrderFromMessage(message, dishes, context);

    if (!orderItems || orderItems.length === 0) {
      session.context.retryCount = (session.context.retryCount || 0) + 1;
      
      if (session.context.retryCount >= 3) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          `😅 I'm having trouble understanding your order.\n\n` +
          `🍽️ Type *menu* to see available dishes\n` +
          `📝 Or try: "2 pizza 1 coke"\n\n` +
          `Type *quit* to start over.`
        );
        return;
      }

      await WhatsAppService.sendMessage(
        phoneNumber,
        `🤔 I couldn't find those items on our menu.\n\n` +
        `Try: "2 pizza 1 coke" or type *menu* to see available dishes.`
      );
      return;
    }

    // Add items to pending order
    if (!session.context.pendingOrder) {
      session.context.pendingOrder = { items: [], totalAmount: 0 };
    }

    // Merge with existing items
    for (const newItem of orderItems) {
      const existingItem = session.context.pendingOrder.items.find(
        item => item.name === newItem.name
      );
      
      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        session.context.pendingOrder.items.push(newItem);
      }
    }

    // Calculate total
    session.context.pendingOrder.totalAmount = session.context.pendingOrder.items
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Show order confirmation
    await WhatsAppController.showOrderConfirmation(phoneNumber, session);
    session.updateStage('confirming_order');
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

      // Removed estimated time display

      // Enhanced timestamp formatting
      const orderTime = moment(order.createdAt).tz('Asia/Kolkata');
      const now = moment().tz('Asia/Kolkata');
      const diffMinutes = now.diff(orderTime, 'minutes');
      
      let timeDisplay;
      if (diffMinutes < 60) {
        timeDisplay = `${diffMinutes} minutes ago`;
      } else if (diffMinutes < 1440) { // Less than 24 hours
        timeDisplay = `${Math.floor(diffMinutes / 60)} hours ago`;
      } else {
        timeDisplay = orderTime.format('DD/MM/YYYY hh:mm A');
      }
      
      message += `📅 Ordered: ${timeDisplay}`;

      // Add estimated completion time for preparing orders
      if (order.status === 'preparing' && order.timeRequired) {
        const completionTime = moment(order.preparationStartedAt || order.createdAt)
          .add(order.timeRequired, 'minutes')
          .tz('Asia/Kolkata');
        
        if (completionTime.isAfter(now)) {
          const remainingMinutes = completionTime.diff(now, 'minutes');
          message += `\n⏱️ Ready in: ~${remainingMinutes} minutes`;
        }
      }

      await WhatsAppService.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error handling tracking request:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        'Sorry, there was an error tracking your order. Please try again later.'
      );
    }
  }

  // Send menu to customer with clean formatting
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

      let menuMessage = `🍽️ *OrderEase Menu*\n\n`;
      
      dishes.forEach((dish, index) => {
        menuMessage += `${index + 1}. *${dish.name}* - ₹${dish.price}\n`;
        if (dish.description) {
          menuMessage += `   _${dish.description}_\n`;
        }
        menuMessage += `\n`;
      });

      menuMessage += `📝 *How to order:*\n`;
      menuMessage += `• "2 pizza 1 coke"\n`;
      menuMessage += `• "I want burger"\n`;
      menuMessage += `• "pizza and coke"\n\n`;
      menuMessage += `Just tell me what you'd like! 😊`;

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

  // Parse order items from message text using Gemini AI + fallback
  static async parseOrderFromMessage(messageBody) {
    try {
      const dishes = await Dish.find({ available: true });
      
      if (dishes.length === 0) {
        console.log('⚠️ No dishes available in database');
        return [];
      }

      // Use Gemini service for intelligent parsing
      const geminiService = new GeminiService();
      const orderItems = await geminiService.parseOrder(messageBody, dishes);

      console.log(`📝 Parsed ${orderItems.length} items from: "${messageBody}"`);
      return orderItems;
    } catch (error) {
      console.error('Error parsing order from message:', error);
      return [];
    }
  }

  // Show order confirmation with quantities
  static async showOrderConfirmation(phoneNumber, session) {
    const order = session.context.pendingOrder;
    
    let message = `🛒 *Your Order*\n\n`;
    
    order.items.forEach(item => {
      message += `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}\n`;
    });
    
    message += `\n💰 *Total: ₹${order.totalAmount}*\n\n`;
    message += `✅ Reply *yes* to confirm\n`;
    message += `✏️ Reply *add [item]* to add more\n`;
    message += `❌ Reply *no* to cancel\n`;
    message += `🔄 Reply *quit* to start over`;

    await WhatsAppService.sendMessage(phoneNumber, message);
  }

  // Handle order confirmation stage
  static async handleOrderConfirmationStage(phoneNumber, message, session) {
    if (message.includes('yes') || message.includes('confirm')) {
      await WhatsAppController.askForCustomerDetails(phoneNumber);
      session.updateStage('collecting_details');
    } else if (message.includes('no') || message.includes('cancel')) {
      session.context.pendingOrder = { items: [], totalAmount: 0 };
      session.updateStage('browsing');
      await WhatsAppService.sendMessage(
        phoneNumber,
        `❌ Order cancelled. What would you like to order instead?`
      );
    } else if (message.includes('add')) {
      // Handle adding more items
      session.updateStage('ordering');
      await WhatsAppController.handleOrderingStage(phoneNumber, message.replace('add', ''), session);
    } else {
      await WhatsAppService.sendMessage(
        phoneNumber,
        `Please reply:\n✅ *yes* to confirm\n❌ *no* to cancel\n✏️ *add [item]* for more items`
      );
    }
  }

  // Ask for customer details
  static async askForCustomerDetails(phoneNumber) {
    const message = `📝 *Almost done!* Please provide your details:\n\n` +
      `Format: Name, Phone, Address\n` +
      `Example: "John Doe, 9876543210, 123 Main Street"\n\n` +
      `💡 You can also send them separately:\n` +
      `Name: John Doe\n` +
      `Phone: 9876543210\n` +
      `Address: 123 Main Street`;

    await WhatsAppService.sendMessage(phoneNumber, message);
  }

  // Handle details collection stage
  static async handleDetailsCollectionStage(phoneNumber, message, session) {
    const geminiService = new GeminiService();
    const customerDetails = await geminiService.parseCustomerDetails(message);

    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      session.context.retryCount = (session.context.retryCount || 0) + 1;
      
      if (session.context.retryCount >= 3) {
        await WhatsAppService.sendMessage(
          phoneNumber,
          `😅 Let's try a simple format:\n\n` +
          `Just send: Your Name, Phone Number, Address\n` +
          `Example: John Doe, 9876543210, 123 Main St`
        );
        return;
      }

      await WhatsAppService.sendMessage(
        phoneNumber,
        `❌ Please provide all details:\n\n` +
        `Format: Name, Phone, Address\n` +
        `Example: "John Doe, 9876543210, 123 Main Street"`
      );
      return;
    }

    // Save customer details
    session.context.customerInfo = customerDetails;

    // Create payment link
    try {
      const paymentLink = await WhatsAppController.createPaymentLink(
        session.context.pendingOrder.totalAmount,
        phoneNumber
      );

      const paymentMessage = `✅ *Details Confirmed!*\n\n` +
        `👤 ${customerDetails.name}\n` +
        `📞 ${customerDetails.phone}\n` +
        `📍 ${customerDetails.address}\n\n` +
        `💰 Total: ₹${session.context.pendingOrder.totalAmount}\n\n` +
        `💳 *Complete Payment:*\n${paymentLink}\n\n` +
        `⚠️ Test mode - Use test card details\n\n` +
        `After payment, you'll get your Order ID for tracking! 🎉`;

      await WhatsAppService.sendMessage(phoneNumber, paymentMessage);
      session.updateStage('payment_pending');

    } catch (error) {
      console.error('Error creating payment link:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        `❌ Sorry, there was an error creating the payment link. Please try again or contact support.`
      );
    }
  }

  // Handle payment pending stage
  static async handlePaymentPendingStage(phoneNumber, message, session) {
    if (message.includes('paid') || message.includes('payment')) {
      await WhatsAppService.sendMessage(
        phoneNumber,
        `⏳ Checking your payment status...\n\n` +
        `If you've completed payment, you'll receive confirmation shortly.\n\n` +
        `💡 Your order will be processed automatically once payment is confirmed.`
      );
    } else {
      await WhatsAppService.sendMessage(
        phoneNumber,
        `⏳ Waiting for payment confirmation...\n\n` +
        `Please complete the payment using the link sent earlier.\n\n` +
        `Need help? Type *quit* to start over.`
      );
    }
  }

  // Handle tracking stage
  static async handleTrackingStage(phoneNumber, message, session) {
    if (message.match(/^\d{8}-\d{3}$/)) {
      await WhatsAppController.handleTrackingRequest(phoneNumber, message);
      session.updateStage('welcome');
    } else {
      await WhatsAppController.askForOrderId(phoneNumber);
    }
  }

  // Ask for order ID
  static async askForOrderId(phoneNumber) {
    await WhatsAppService.sendMessage(
      phoneNumber,
      `🔍 Please send your Order ID to track your order.\n\n` +
      `Format: YYYYMMDD-XXX\n` +
      `Example: 20241031-001`
    );
  }

  // Check if message is an order
  static async isOrderMessage(message) {
    // Simple heuristics for order detection
    const orderKeywords = ['want', 'order', 'get', 'pizza', 'burger', 'coke', 'pasta'];
    const hasNumbers = /\d/.test(message);
    const hasOrderKeywords = orderKeywords.some(keyword => message.includes(keyword));
    
    return hasNumbers || hasOrderKeywords || message.split(' ').length <= 6;
  }

  // Send welcome message
  static async sendWelcomeMessage(phoneNumber) {
    const message = `👋 Welcome to *OrderEase*!\n\n` +
      `🍽️ Type *menu* to see our dishes\n` +
      `📝 Just tell me what you'd like to order\n` +
      `🔍 Send an Order ID to track your order\n\n` +
      `Examples:\n` +
      `• "2 pizza 1 coke"\n` +
      `• "I want burger"\n` +
      `• "menu"\n\n` +
      `💡 Type *quit* anytime to start fresh\n\n` +
      `How can I help you today? 😊`;

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