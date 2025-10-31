const WhatsAppService = require('./whatsappService');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const WhatsAppOrder = require('../models/WhatsAppOrder');
const moment = require('moment-timezone');

class SimpleOrderBot {
  // Main message handler - keep it simple
  static async handleMessage(phoneNumber, messageBody) {
    try {
      const message = messageBody.toLowerCase().trim();
      console.log(`📱 ${phoneNumber}: "${messageBody}"`);

      // Handle special commands
      if (message === 'menu' || message === 'list') {
        return await SimpleOrderBot.sendMenu(phoneNumber);
      }

      if (message.includes('track') || message.match(/^\d{8}-\d{3}$/)) {
        return await SimpleOrderBot.handleTracking(phoneNumber, message);
      }

      if (message === 'hi' || message === 'hello' || message === 'start') {
        return await SimpleOrderBot.sendWelcome(phoneNumber);
      }

      // Try to parse as order
      const orderItems = await SimpleOrderBot.parseSimpleOrder(message);
      if (orderItems.length > 0) {
        return await SimpleOrderBot.handleOrder(phoneNumber, orderItems);
      }

      // Default response
      return await SimpleOrderBot.sendHelp(phoneNumber);

    } catch (error) {
      console.error('Error in handleMessage:', error);
      await WhatsAppService.sendMessage(
        phoneNumber,
        '❌ Sorry, something went wrong. Type *menu* to see our dishes or *hi* to start over.'
      );
    }
  }

  // Simple order parsing - just look for numbers and dish names
  static async parseSimpleOrder(message) {
    try {
      const dishes = await Dish.find({ available: true });
      const orderItems = [];
      const words = message.toLowerCase().split(/\s+/);

      console.log('🔍 Parsing:', message);
      console.log('📋 Available dishes:', dishes.map(d => d.name));

      // Look for patterns like "2 pizza", "1 margherita", etc.
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const quantity = parseInt(word);

        if (!isNaN(quantity) && quantity > 0) {
          // Look for dish name in next few words
          for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
            const dishName = words.slice(i + 1, j + 1).join(' ');
            
            // Find matching dish (flexible matching)
            const matchingDish = dishes.find(dish => {
              const dishLower = dish.name.toLowerCase();
              return dishLower.includes(dishName) || 
                     dishName.includes(dishLower) ||
                     dishLower.includes(dishName.replace(/s$/, '')) || // handle plurals
                     SimpleOrderBot.fuzzyMatch(dishLower, dishName);
            });

            if (matchingDish) {
              console.log(`✅ Found: ${quantity} x ${matchingDish.name}`);
              
              // Check if already in order
              const existing = orderItems.find(item => item.name === matchingDish.name);
              if (existing) {
                existing.quantity += quantity;
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
      }

      // Also try without numbers (assume quantity 1)
      if (orderItems.length === 0) {
        for (const dish of dishes) {
          const dishLower = dish.name.toLowerCase();
          if (message.includes(dishLower) || 
              message.includes(dishLower.replace(/s$/, '')) ||
              SimpleOrderBot.fuzzyMatch(dishLower, message)) {
            
            console.log(`✅ Found (qty 1): ${dish.name}`);
            orderItems.push({
              name: dish.name,
              quantity: 1,
              price: dish.price
            });
            break; // Only match first dish to avoid confusion
          }
        }
      }

      console.log('📦 Parsed items:', orderItems);
      return orderItems;

    } catch (error) {
      console.error('Error parsing order:', error);
      return [];
    }
  }

  // Simple fuzzy matching
  static fuzzyMatch(dishName, userInput) {
    // Remove common words and check similarity
    const cleanDish = dishName.replace(/pizza|burger|coke|drink/g, '').trim();
    const cleanInput = userInput.replace(/pizza|burger|coke|drink/g, '').trim();
    
    if (cleanDish && cleanInput) {
      return cleanDish.includes(cleanInput) || cleanInput.includes(cleanDish);
    }
    return false;
  }

  // Handle order - create and ask for details
  static async handleOrder(phoneNumber, orderItems) {
    try {
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create or update WhatsApp order
      let whatsappOrder = await WhatsAppOrder.findOne({
        phoneNumber,
        status: { $in: ['pending_details', 'pending_payment'] }
      });

      if (!whatsappOrder) {
        whatsappOrder = new WhatsAppOrder({
          phoneNumber,
          items: orderItems,
          totalAmount,
          status: 'pending_details'
        });
      } else {
        whatsappOrder.items = orderItems;
        whatsappOrder.totalAmount = totalAmount;
      }

      await whatsappOrder.save();

      // Send order confirmation
      let message = `🛒 *Your Order*\n\n`;
      orderItems.forEach(item => {
        message += `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}\n`;
      });
      message += `\n💰 *Total: ₹${totalAmount}*\n\n`;
      message += `📝 Please send your details:\n`;
      message += `Format: Name, Phone, Address\n\n`;
      message += `Example: John Doe, 9876543210, Mumbai\n\n`;
      message += `Or reply *cancel* to cancel this order`;

      await WhatsAppService.sendMessage(phoneNumber, message);

    } catch (error) {
      console.error('Error handling order:', error);
      await WhatsAppService.sendMessage(phoneNumber, '❌ Error processing order. Please try again.');
    }
  }

  // Send menu
  static async sendMenu(phoneNumber) {
    try {
      const dishes = await Dish.find({ available: true }).sort({ name: 1 });
      
      if (dishes.length === 0) {
        return await WhatsAppService.sendMessage(phoneNumber, '❌ No dishes available right now.');
      }

      let message = `🍽️ *OrderEase Menu*\n\n`;
      dishes.forEach((dish, index) => {
        message += `${index + 1}. *${dish.name}* - ₹${dish.price}\n`;
        if (dish.description) {
          message += `   _${dish.description}_\n`;
        }
        message += `\n`;
      });

      message += `📝 *How to order:*\n`;
      message += `• "2 pizza"\n`;
      message += `• "1 margherita pizza"\n`;
      message += `• "burger and coke"\n\n`;
      message += `Just tell me what you want! 😊`;

      await WhatsAppService.sendMessage(phoneNumber, message);

    } catch (error) {
      console.error('Error sending menu:', error);
      await WhatsAppService.sendMessage(phoneNumber, '❌ Error loading menu. Please try again.');
    }
  }

  // Send welcome message
  static async sendWelcome(phoneNumber) {
    const message = `👋 *Welcome to OrderEase!*\n\n` +
      `🍽️ Type *menu* to see our dishes\n` +
      `📝 Just tell me what you want to order\n` +
      `🔍 Send Order ID to track your order\n\n` +
      `*Examples:*\n` +
      `• "2 pizza"\n` +
      `• "margherita pizza"\n` +
      `• "burger and coke"\n\n` +
      `What would you like today? 😊`;

    await WhatsAppService.sendMessage(phoneNumber, message);
  }

  // Send help message
  static async sendHelp(phoneNumber) {
    const message = `🤔 I didn't understand that.\n\n` +
      `*Try:*\n` +
      `• "menu" - See all dishes\n` +
      `• "2 pizza" - Order 2 pizzas\n` +
      `• "margherita" - Order margherita pizza\n` +
      `• "track 20241031-001" - Track order\n\n` +
      `What would you like to order? 😊`;

    await WhatsAppService.sendMessage(phoneNumber, message);
  }

  // Handle order tracking
  static async handleTracking(phoneNumber, message) {
    try {
      let orderId = null;

      // Extract order ID
      const orderIdMatch = message.match(/(\d{8}-\d{3})/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
      } else {
        return await WhatsAppService.sendMessage(
          phoneNumber,
          '🔍 Please send your Order ID\n\nExample: 20241031-001'
        );
      }

      // Find order
      const order = await Order.findOne({ displayOrderId: orderId });
      if (!order) {
        return await WhatsAppService.sendMessage(
          phoneNumber,
          `❌ Order ${orderId} not found. Please check your Order ID.`
        );
      }

      // Send status
      const statusEmoji = {
        'queued': '⏳',
        'preparing': '👨‍🍳',
        'ready': '✅',
        'picked': '📦'
      };

      const statusText = {
        'queued': 'Order Received',
        'preparing': 'Being Prepared',
        'ready': 'Ready for Pickup',
        'picked': 'Completed'
      };

      let trackMessage = `${statusEmoji[order.status]} *${statusText[order.status]}*\n\n`;
      trackMessage += `📋 Order ID: ${order.displayOrderId}\n`;
      trackMessage += `👤 Customer: ${order.customer.name}\n\n`;
      
      trackMessage += `🍽️ *Items:*\n`;
      order.items.forEach(item => {
        trackMessage += `• ${item.name} × ${item.quantity}\n`;
      });

      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      trackMessage += `\n💰 Total: ₹${totalAmount}`;

      await WhatsAppService.sendMessage(phoneNumber, trackMessage);

    } catch (error) {
      console.error('Error tracking order:', error);
      await WhatsAppService.sendMessage(phoneNumber, '❌ Error tracking order. Please try again.');
    }
  }

  // Handle customer details
  static async handleCustomerDetails(phoneNumber, message) {
    try {
      // Find pending order
      const whatsappOrder = await WhatsAppOrder.findOne({
        phoneNumber,
        status: 'pending_details'
      });

      if (!whatsappOrder) {
        return await WhatsAppService.sendMessage(phoneNumber, '❌ No pending order found. Please place a new order.');
      }

      if (message.toLowerCase().includes('cancel')) {
        await whatsappOrder.deleteOne();
        return await WhatsAppService.sendMessage(phoneNumber, '❌ Order cancelled. Type *menu* to start a new order.');
      }

      // Parse customer details
      const parts = message.split(',').map(part => part.trim());
      if (parts.length < 3) {
        return await WhatsAppService.sendMessage(
          phoneNumber,
          '❌ Please provide: Name, Phone, Address\n\nExample: John Doe, 9876543210, Mumbai'
        );
      }

      const [name, phone, address] = parts;

      // Update order with customer details
      whatsappOrder.customer = { name, phone, address };
      whatsappOrder.status = 'pending_payment';
      await whatsappOrder.save();

      // Create payment link (simplified)
      const paymentMessage = `✅ *Details Confirmed!*\n\n` +
        `👤 ${name}\n` +
        `📞 ${phone}\n` +
        `📍 ${address}\n\n` +
        `💰 Total: ₹${whatsappOrder.totalAmount}\n\n` +
        `💳 *Payment Link:*\n` +
        `[Payment will be integrated here]\n\n` +
        `For now, your order is confirmed! 🎉`;

      await WhatsAppService.sendMessage(phoneNumber, paymentMessage);

      // Create actual order in system
      await SimpleOrderBot.createMainOrder(whatsappOrder);

    } catch (error) {
      console.error('Error handling customer details:', error);
      await WhatsAppService.sendMessage(phoneNumber, '❌ Error processing details. Please try again.');
    }
  }

  // Create main order
  static async createMainOrder(whatsappOrder) {
    try {
      // Generate order ID
      const nowIST = moment().tz('Asia/Kolkata');
      const datePrefix = nowIST.format('YYYYMMDD');
      
      const todayStart = nowIST.clone().startOf('day');
      const todayEnd = nowIST.clone().endOf('day');
      const latestOrder = await Order.findOne({
        createdAt: { $gte: todayStart.toDate(), $lte: todayEnd.toDate() },
        displayOrderId: { $regex: `^${datePrefix}-` }
      }).sort({ displayOrderId: -1 });

      let nextNumber = 1;
      if (latestOrder && latestOrder.displayOrderId) {
        const match = latestOrder.displayOrderId.match(/-(\d{3})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const displayOrderId = `${datePrefix}-${String(nextNumber).padStart(3, '0')}`;

      // Create main order
      const order = new Order({
        items: whatsappOrder.items,
        customer: whatsappOrder.customer,
        status: 'queued',
        displayOrderId: displayOrderId,
        source: 'whatsapp'
      });

      await order.save();

      // Update WhatsApp order
      whatsappOrder.mainOrderId = order._id;
      whatsappOrder.status = 'completed';
      await whatsappOrder.save();

      // Send confirmation
      const confirmMessage = `🎉 *Order Placed Successfully!*\n\n` +
        `📋 *Order ID:* ${displayOrderId}\n\n` +
        `Your order is now being prepared!\n` +
        `Track anytime by sending: ${displayOrderId}\n\n` +
        `Thank you for choosing OrderEase! 😊`;

      await WhatsAppService.sendMessage(whatsappOrder.phoneNumber, confirmMessage);

    } catch (error) {
      console.error('Error creating main order:', error);
    }
  }
}

module.exports = SimpleOrderBot;