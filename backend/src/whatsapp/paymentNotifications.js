const WhatsAppService = require('./whatsappService');
const Order = require('../models/Order');
const WhatsAppOrder = require('../models/WhatsAppOrder');
const moment = require('moment-timezone');

class PaymentNotifications {
  // Handle payment success - send WhatsApp notification
  static async handlePaymentSuccess(paymentData) {
    try {
      console.log('💳 Processing payment success:', paymentData);

      const { razorpay_payment_id, whatsapp_order_id, phoneNumber } = paymentData;

      // Find the WhatsApp order
      let whatsappOrder = null;
      
      if (whatsapp_order_id) {
        whatsappOrder = await WhatsAppOrder.findById(whatsapp_order_id);
      }

      // If using simplified approach with main Order collection
      if (!whatsappOrder && phoneNumber) {
        const order = await Order.findOne({
          'customer.phone': phoneNumber,
          status: 'pending_payment'
        });

        if (order) {
          // Update order status to queued
          order.status = 'queued';
          order.paymentDetails = {
            razorpay_payment_id: razorpay_payment_id,
            payment_status: 'completed'
          };
          await order.save();

          // Send success notification
          await PaymentNotifications.sendPaymentSuccessMessage(phoneNumber, order);
          return true;
        }
      }

      // Handle WhatsAppOrder collection approach
      if (whatsappOrder) {
        whatsappOrder.status = 'paid';
        whatsappOrder.razorpayPaymentId = razorpay_payment_id;
        await whatsappOrder.save();

        // Create main order
        const mainOrder = await PaymentNotifications.createMainOrder(whatsappOrder);
        
        // Send success notification
        await PaymentNotifications.sendPaymentSuccessMessage(whatsappOrder.phoneNumber, mainOrder);
        return true;
      }

      console.log('⚠️ No matching order found for payment success');
      return false;

    } catch (error) {
      console.error('❌ Error handling payment success:', error);
      return false;
    }
  }

  // Handle payment failure - send WhatsApp notification
  static async handlePaymentFailure(paymentData) {
    try {
      console.log('💳 Processing payment failure:', paymentData);

      const { phoneNumber, orderId } = paymentData;

      if (phoneNumber) {
        const failureMessage = `❌ *Payment Failed*\n\n` +
          `Your payment could not be processed.\n\n` +
          `💡 *What you can do:*\n` +
          `• Try the payment link again\n` +
          `• Use a different payment method\n` +
          `• Contact support if issue persists\n\n` +
          `Your order is still saved. Complete payment to confirm it.\n\n` +
          `Need help? Just ask! 😊`;

        await WhatsAppService.sendMessage(phoneNumber, failureMessage);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
      return false;
    }
  }

  // Send payment success message with Order ID
  static async sendPaymentSuccessMessage(phoneNumber, order) {
    try {
      const orderTime = moment().tz('Asia/Kolkata').format('hh:mm A');
      
      let successMessage = `🎉 *Payment Successful!*\n\n`;
      successMessage += `✅ Order placed at ${orderTime}\n`;
      successMessage += `📋 *Order ID:* ${order.displayOrderId}\n\n`;
      
      successMessage += `👤 ${order.customer.name}\n`;
      successMessage += `📞 ${order.customer.phone}\n\n`;
      
      successMessage += `🍽️ *Your Order:*\n`;
      order.items.forEach(item => {
        successMessage += `• ${item.name} × ${item.quantity}\n`;
      });
      
      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      successMessage += `\n💰 Total: ₹${totalAmount}\n\n`;
      
      successMessage += `👨‍🍳 Your order is being prepared\n`;
      successMessage += `⏱️ Estimated time: 15-30 minutes\n\n`;
      successMessage += `🔍 *Track anytime:* Send ${order.displayOrderId}\n\n`;
      successMessage += `Thank you for choosing OrderEase! 😊`;

      const success = await WhatsAppService.sendMessage(phoneNumber, successMessage);
      console.log(`📱 Payment success notification sent to ${phoneNumber}:`, success);
      
      return success;

    } catch (error) {
      console.error('❌ Error sending payment success message:', error);
      return false;
    }
  }

  // Create main order from WhatsApp order
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
        source: 'whatsapp',
        paymentDetails: {
          razorpay_payment_id: whatsappOrder.razorpayPaymentId,
          payment_status: 'completed'
        }
      });

      await order.save();

      // Update WhatsApp order
      whatsappOrder.mainOrderId = order._id;
      whatsappOrder.status = 'completed';
      await whatsappOrder.save();

      console.log(`✅ Main order created: ${displayOrderId}`);
      return order;

    } catch (error) {
      console.error('❌ Error creating main order:', error);
      throw error;
    }
  }
}

module.exports = PaymentNotifications;