const WhatsAppOrder = require('../models/WhatsAppOrder');
const Order = require('../models/Order');
const WhatsAppService = require('./whatsappService');

class WhatsAppAdminController {
  // Get all WhatsApp orders with pagination
  static async getAllWhatsAppOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }

      // Get orders with pagination
      const orders = await WhatsAppOrder.find(query)
        .populate('mainOrder')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await WhatsAppOrder.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders: orders.map(order => ({
            id: order._id,
            phoneNumber: order.phoneNumber,
            customerName: order.customer?.name || 'N/A',
            totalAmount: order.totalAmount,
            status: order.status,
            itemCount: order.items.length,
            createdAt: order.createdAt,
            mainOrderId: order.mainOrderId,
            displayOrderId: order.mainOrder?.displayOrderId || null
          })),
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: orders.length,
            totalRecords: total
          }
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch WhatsApp orders'
      });
    }
  }

  // Get detailed WhatsApp order by ID
  static async getWhatsAppOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await WhatsAppOrder.findById(id)
        .populate('mainOrder');

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'WhatsApp order not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: order._id,
          phoneNumber: order.phoneNumber,
          customer: order.customer,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentId: order.paymentId,
          razorpayPaymentId: order.razorpayPaymentId,
          mainOrder: order.mainOrder,
          messageHistory: order.messageHistory,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch WhatsApp order'
      });
    }
  }

  // Get WhatsApp order statistics
  static async getWhatsAppStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get basic counts
      const totalOrders = await WhatsAppOrder.countDocuments();
      const todayOrders = await WhatsAppOrder.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      });

      // Get orders by status
      const statusStats = await WhatsAppOrder.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      // Get successful orders (paid)
      const successfulOrders = await WhatsAppOrder.countDocuments({ status: 'paid' });
      const totalRevenue = await WhatsAppOrder.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      // Get orders by hour for today
      const hourlyStats = await WhatsAppOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Get top customers
      const topCustomers = await WhatsAppOrder.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$phoneNumber',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            customerName: { $first: '$customer.name' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalOrders,
            todayOrders,
            successfulOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            conversionRate: totalOrders > 0 ? ((successfulOrders / totalOrders) * 100).toFixed(2) : 0
          },
          statusBreakdown: statusStats,
          hourlyActivity: hourlyStats,
          topCustomers: topCustomers.map(customer => ({
            phoneNumber: customer._id,
            name: customer.customerName || 'Unknown',
            orderCount: customer.orderCount,
            totalSpent: customer.totalSpent
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  // Send manual message to customer
  static async sendManualMessage(req, res) {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and message are required'
        });
      }

      const success = await WhatsAppService.sendMessage(phoneNumber, message);

      if (success) {
        // Log the manual message
        const whatsappOrder = await WhatsAppOrder.findOne({ phoneNumber })
          .sort({ createdAt: -1 });

        if (whatsappOrder) {
          whatsappOrder.messageHistory.push({
            type: 'manual_message',
            content: message,
            direction: 'outgoing',
            timestamp: new Date()
          });
          await whatsappOrder.save();
        }

        res.json({
          success: true,
          message: 'Message sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send message'
        });
      }
    } catch (error) {
      console.error('Error sending manual message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  // Update order status and notify customer
  static async updateOrderStatusWithNotification(req, res) {
    try {
      const { orderId, status, phoneNumber, notifyCustomer = true } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Order ID and status are required'
        });
      }

      // Update the main order
      const order = await Order.findOneAndUpdate(
        { displayOrderId: orderId },
        { status },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Send WhatsApp notification if requested and phone number is provided
      if (notifyCustomer && phoneNumber) {
        await WhatsAppService.sendStatusUpdate(phoneNumber, order, status);
        
        // Log the status update message
        const whatsappOrder = await WhatsAppOrder.findOne({ 
          mainOrderId: order._id 
        });

        if (whatsappOrder) {
          whatsappOrder.messageHistory.push({
            type: 'status_update',
            content: `Status updated to: ${status}`,
            direction: 'outgoing',
            timestamp: new Date()
          });
          await whatsappOrder.save();
        }
      }

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          orderId: order.displayOrderId,
          status: order.status,
          notificationSent: notifyCustomer && phoneNumber
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  }

  // Get message history for a phone number
  static async getMessageHistory(req, res) {
    try {
      const { phoneNumber } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const orders = await WhatsAppOrder.find({ phoneNumber })
        .sort({ createdAt: -1 })
        .limit(5); // Get last 5 orders

      const allMessages = [];
      
      orders.forEach(order => {
        order.messageHistory.forEach(msg => {
          allMessages.push({
            orderId: order._id,
            type: msg.type,
            content: msg.content,
            direction: msg.direction,
            timestamp: msg.timestamp
          });
        });
      });

      // Sort all messages by timestamp
      allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        data: {
          phoneNumber,
          messages: allMessages.slice(0, limit),
          orderCount: orders.length
        }
      });
    } catch (error) {
      console.error('Error fetching message history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message history'
      });
    }
  }

  // Get active conversations (recent activity)
  static async getActiveConversations(req, res) {
    try {
      const hoursAgo = parseInt(req.query.hours) || 24;
      const since = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

      const activeOrders = await WhatsAppOrder.find({
        updatedAt: { $gte: since }
      })
      .sort({ updatedAt: -1 })
      .limit(50);

      const conversations = activeOrders.map(order => ({
        phoneNumber: order.phoneNumber,
        customerName: order.customer?.name || 'Unknown',
        lastActivity: order.updatedAt,
        status: order.status,
        totalAmount: order.totalAmount,
        messageCount: order.messageHistory.length,
        lastMessage: order.messageHistory[order.messageHistory.length - 1]?.content || 'No messages'
      }));

      res.json({
        success: true,
        data: {
          conversations,
          timeframe: `${hoursAgo} hours`,
          count: conversations.length
        }
      });
    } catch (error) {
      console.error('Error fetching active conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active conversations'
      });
    }
  }
}

module.exports = WhatsAppAdminController;