const crypto = require('crypto');
const Order = require('../models/Order');
const WhatsAppOrder = require('../models/WhatsAppOrder');
const WhatsAppService = require('./whatsappService');
const moment = require('moment-timezone');

class RazorpayWebhookHandler {
  // Verify Razorpay webhook signature
  static verifySignature(body, signature) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!secret) {
        console.warn('Razorpay webhook secret not configured - skipping signature verification');
        return true; // Allow in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Razorpay signature:', error);
      return false;
    }
  }

  // Handle Razorpay webhook events
  static async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = req.body;

      // Verify signature
      if (!RazorpayWebhookHandler.verifySignature(body, signature)) {
        console.error('Invalid Razorpay webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = body.event;
      const payload = body.payload;

      console.log(`Received Razorpay webhook: ${event}`);

      switch (event) {
        case 'payment_link.paid':
          await RazorpayWebhookHandler.handlePaymentLinkPaid(payload);
          break;
        
        case 'payment.captured':
          await RazorpayWebhookHandler.handlePaymentCaptured(payload);
          break;
        
        case 'payment.failed':
          await RazorpayWebhookHandler.handlePaymentFailed(payload);
          break;
        
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle payment link paid event
  static async handlePaymentLinkPaid(payload) {
    try {
      const paymentLink = payload.payment_link.entity;
      const payment = payload.payment.entity;
      
      const whatsappOrderId = paymentLink.notes?.whatsapp_order_id;
      
      if (!whatsappOrderId) {
        console.error('No WhatsApp order ID found in payment link notes');
        
        // Try to handle simplified approach - find pending payment order
        const pendingOrder = await Order.findOne({
          status: 'pending_payment',
          source: 'whatsapp'
        }).sort({ createdAt: -1 });

        if (pendingOrder) {
          // Update order status
          pendingOrder.status = 'queued';
          pendingOrder.paymentDetails = {
            razorpay_payment_id: payment.id,
            payment_status: 'completed'
          };
          await pendingOrder.save();

          // Send success notification
          const PaymentNotifications = require('./paymentNotifications');
          await PaymentNotifications.sendPaymentSuccessMessage(pendingOrder.customer.phone, pendingOrder);
          
          console.log(`Payment successful for simplified order: ${pendingOrder.displayOrderId}`);
        }
        return;
      }

      // Find the WhatsApp order
      const whatsappOrder = await WhatsAppOrder.findById(whatsappOrderId);
      if (!whatsappOrder) {
        console.error(`WhatsApp order not found: ${whatsappOrderId}`);
        return;
      }

      // Create order in main Order collection
      const orderData = await RazorpayWebhookHandler.createMainOrder(whatsappOrder, payment);
      
      // Update WhatsApp order status
      whatsappOrder.status = 'paid';
      whatsappOrder.paymentId = payment.id;
      whatsappOrder.mainOrderId = orderData._id;
      whatsappOrder.razorpayPaymentId = payment.id;
      await whatsappOrder.save();

      // Update chat session to completed state
      const ChatSession = require('../models/ChatSession');
      const session = await ChatSession.findOne({ 
        phoneNumber: whatsappOrder.phoneNumber, 
        isActive: true 
      });
      
      if (session) {
        session.updateStage('order_placed');
        session.context.completedOrderId = orderData.displayOrderId;
        await session.save();
      }

      // Send confirmation message to customer
      const PaymentNotifications = require('./paymentNotifications');
      await PaymentNotifications.sendPaymentSuccessMessage(whatsappOrder.phoneNumber, orderData);

      console.log(`Payment successful for WhatsApp order: ${whatsappOrderId}`);
    } catch (error) {
      console.error('Error handling payment link paid:', error);
    }
  }

  // Handle payment captured event
  static async handlePaymentCaptured(payload) {
    try {
      const payment = payload.payment.entity;
      
      // Find WhatsApp order by payment ID
      const whatsappOrder = await WhatsAppOrder.findOne({ 
        razorpayPaymentId: payment.id 
      });

      if (whatsappOrder && whatsappOrder.mainOrderId) {
        // Update main order status if needed
        const mainOrder = await Order.findById(whatsappOrder.mainOrderId);
        if (mainOrder && mainOrder.status === 'queued') {
          // Order is already created and in queue, no additional action needed
          console.log(`Payment captured for order: ${mainOrder.displayOrderId}`);
        }
      }
    } catch (error) {
      console.error('Error handling payment captured:', error);
    }
  }

  // Handle payment failed event
  static async handlePaymentFailed(payload) {
    try {
      const payment = payload.payment.entity;
      
      // Try to find WhatsApp order by payment link notes if available
      let whatsappOrder = null;
      let phoneNumber = null;
      
      // If payment has notes with whatsapp_order_id
      if (payment.notes && payment.notes.whatsapp_order_id) {
        whatsappOrder = await WhatsAppOrder.findById(payment.notes.whatsapp_order_id);
        if (whatsappOrder) {
          phoneNumber = whatsappOrder.phoneNumber;
        }
      }
      
      // Fallback: find by pending payment status (most recent)
      if (!whatsappOrder) {
        whatsappOrder = await WhatsAppOrder.findOne({
          status: 'pending_payment'
        }).sort({ createdAt: -1 });
        
        if (whatsappOrder) {
          phoneNumber = whatsappOrder.phoneNumber;
        }
      }
      
      // If no WhatsAppOrder found, try simplified approach
      if (!phoneNumber) {
        const pendingOrder = await Order.findOne({
          status: 'pending_payment',
          source: 'whatsapp'
        }).sort({ createdAt: -1 });
        
        if (pendingOrder) {
          phoneNumber = pendingOrder.customer.phone;
        }
      }

      if (phoneNumber) {
        // Send payment failure message using PaymentNotifications
        const PaymentNotifications = require('./paymentNotifications');
        await PaymentNotifications.handlePaymentFailure({
          phoneNumber: phoneNumber,
          orderId: whatsappOrder ? whatsappOrder._id : 'unknown'
        });

        // Update order status if WhatsAppOrder exists
        if (whatsappOrder) {
          whatsappOrder.status = 'payment_failed';
          await whatsappOrder.save();
        }
        
        console.log(`Payment failed notification sent to ${phoneNumber}`);
      } else {
        console.log('No WhatsApp order or phone number found for failed payment');
      }

      console.log(`Payment failed: ${payment.id}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  // Create main order from WhatsApp order
  static async createMainOrder(whatsappOrder, payment) {
    try {
      // Generate display order ID
      const nowIST = moment().tz('Asia/Kolkata');
      const datePrefix = nowIST.format('YYYYMMDD');

      const todayStart = nowIST.clone().startOf('day');
      const todayEnd = nowIST.clone().endOf('day');
      const latestOrder = await Order.findOne({
        createdAt: { $gte: todayStart.toDate(), $lte: todayEnd.toDate() },
        displayOrderId: { $regex: `^${datePrefix}-` }
      })
        .sort({ displayOrderId: -1 })
        .exec();

      let nextNumber = 1;
      if (latestOrder && latestOrder.displayOrderId) {
        const match = latestOrder.displayOrderId.match(/-(\d{3})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const displayOrderId = `${datePrefix}-${String(nextNumber).padStart(3, '0')}`;

      // Create the main order
      const orderData = {
        items: whatsappOrder.items,
        customer: whatsappOrder.customer,
        status: 'queued',
        displayOrderId: displayOrderId,
        source: 'whatsapp',
        paymentId: payment.id,
        paymentStatus: 'paid'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      console.log(`Created main order: ${displayOrderId} from WhatsApp order: ${whatsappOrder._id}`);
      return savedOrder;
    } catch (error) {
      console.error('Error creating main order:', error);
      throw error;
    }
  }

  // Handle payment success callback (when user returns from payment page)
  static async handlePaymentSuccess(req, res) {
    try {
      const { razorpay_payment_id, razorpay_payment_link_id } = req.query;

      if (!razorpay_payment_id || !razorpay_payment_link_id) {
        // Redirect to track page with error
        return res.redirect('https://order-ease-i1t7.onrender.com/track?error=payment_info_missing');
      }

      // Find the WhatsApp order
      const whatsappOrder = await WhatsAppOrder.findOne({
        razorpayPaymentId: razorpay_payment_id
      });

      if (!whatsappOrder) {
        // Redirect to track page with error
        return res.redirect(`https://order-ease-i1t7.onrender.com/track?error=order_not_found&payment_id=${razorpay_payment_id}`);
      }

      // Get the main order
      const mainOrder = await Order.findById(whatsappOrder.mainOrderId);

      if (!mainOrder) {
        // Redirect to track page with error
        return res.redirect('https://order-ease-i1t7.onrender.com/track?error=order_processing');
      }

      // Successful payment - redirect to track page with order ID
      return res.redirect(`https://order-ease-i1t7.onrender.com/track?order_id=${mainOrder.displayOrderId}&payment_success=true&source=whatsapp`);

    } catch (error) {
      console.error('Error handling payment success callback:', error);
      // Redirect to track page with error
      return res.redirect('https://order-ease-i1t7.onrender.com/track?error=processing_error');
    }
  }
}

module.exports = RazorpayWebhookHandler;