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

      // Send confirmation message to customer
      await WhatsAppService.sendPaymentSuccess(whatsappOrder.phoneNumber, orderData);

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
      
      // Find WhatsApp order by payment attempt
      const whatsappOrder = await WhatsAppOrder.findOne({
        status: 'pending_payment',
        // You might need to store payment attempt ID or use other identifiers
      });

      if (whatsappOrder) {
        // Send payment failure message
        await WhatsAppService.sendMessage(
          whatsappOrder.phoneNumber,
          `❌ *Payment Failed*\n\n` +
          `Your payment could not be processed. Please try again.\n\n` +
          `If you continue to face issues, please contact support.\n\n` +
          `Order ID: ${whatsappOrder._id}`
        );

        // Update order status
        whatsappOrder.status = 'payment_failed';
        await whatsappOrder.save();
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
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #e74c3c;">❌ Payment Information Missing</h2>
              <p>Required payment information is missing. Please contact support.</p>
            </body>
          </html>
        `);
      }

      // Find the WhatsApp order
      const whatsappOrder = await WhatsAppOrder.findOne({
        razorpayPaymentId: razorpay_payment_id
      });

      if (!whatsappOrder) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #e74c3c;">❌ Order Not Found</h2>
              <p>We couldn't find your order. Please contact support with payment ID: ${razorpay_payment_id}</p>
            </body>
          </html>
        `);
      }

      // Get the main order
      const mainOrder = await Order.findById(whatsappOrder.mainOrderId);

      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <div style="max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 30px; border-radius: 10px;">
              <h2 style="color: #27ae60;">✅ Payment Successful!</h2>
              <p style="font-size: 18px; margin: 20px 0;">Thank you for your payment!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${mainOrder?.displayOrderId || 'Processing...'}</p>
                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Amount:</strong> ₹${whatsappOrder.totalAmount}</p>
                <p><strong>Status:</strong> Order Placed Successfully</p>
              </div>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📱 WhatsApp Confirmation Sent!</strong></p>
                <p>You will receive order updates on WhatsApp.</p>
                <p>Track your order by sending: <strong>${mainOrder?.displayOrderId || 'Your Order ID'}</strong></p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                You can close this window now.
              </p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling payment success callback:', error);
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #e74c3c;">❌ Error Processing Payment</h2>
            <p>There was an error processing your payment confirmation. Please contact support.</p>
          </body>
        </html>
      `);
    }
  }
}

module.exports = RazorpayWebhookHandler;