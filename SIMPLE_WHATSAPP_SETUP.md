# Simple WhatsApp Integration Setup for OrderEase

## 🎯 Quick Setup Guide

This guide will help you set up the basic WhatsApp webhook integration for your OrderEase system.

## 📋 Current Implementation

### ✅ What's Working
- **Webhook Verification** - Handles Meta's webhook verification
- **Message Reception** - Receives and logs incoming WhatsApp messages
- **Auto-Reply** - Sends welcome messages to users
- **Test Endpoint** - Manual message sending for testing

### 🔧 Environment Variables (Already Set)
```env
WHATSAPP_ACCESS_TOKEN=EAAMT8OZBPzCsBP5z17WiIqCXZApfhSbZCrSkjVw8ECnhYmpNe3IZApVbtyfc8N9oNSyWQFxAedJqSu5qX105Ccb9cftkDIz6zDysBY85pDANzsfWiQjirQWZCdgVbU2Esgs6i2TUkHD59m5a5sKQGuREH5TWC4ZBenzwz4vgXbTJzo5rVkm7iZCSKgLpWqyGKS5FPugzkcZCjs7O9j2iWuKz8C8vevnXjgYnydXQrMDEpgIAMdK8KfSF4L7diNclsgTHtTRlUlZAUoB1wFZAYdZCaaZCqqsZD
WHATSAPP_PHONE_NUMBER_ID=833339916533428
WHATSAPP_VERIFY_TOKEN=vebsdev23
BACKEND_URL=https://order-ease-backend.onrender.com
```

## 🚀 Deployment Steps

### 1. Deploy to Render
Your code is ready to deploy. The webhook will be available at:
```
https://order-ease-backend.onrender.com/api/whatsapp/webhook
```

### 2. Configure Meta Webhook

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your WhatsApp app
3. Go to WhatsApp > Configuration
4. Set up webhook:
   - **Webhook URL**: `https://order-ease-backend.onrender.com/api/whatsapp/webhook`
   - **Verify Token**: `vebsdev23`
   - **Webhook Fields**: Subscribe to `messages`

### 3. Test the Integration

#### Test Webhook Verification
```bash
curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"
```
**Expected Response**: `test123`

#### Test Manual Message Sending
```bash
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Hello from OrderEase! This is a test message."
  }'
```

#### Test Health Check
```bash
curl https://order-ease-backend.onrender.com/api/whatsapp/health
```

## 📱 How It Works

### Message Flow
1. **Customer sends message** to your WhatsApp test number
2. **Meta forwards message** to your webhook
3. **Your server logs** the message to console
4. **Auto-reply sent** with welcome message

### Sample Incoming Message JSON
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "id": "wamid.xxx",
          "text": {
            "body": "Hello"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

### Sample Auto-Reply Message
```
👋 Welcome to *OrderEase*!

Thank you for contacting us. We received your message: "Hello"

🍽️ We're a restaurant order management system
📝 Soon you'll be able to place orders directly through WhatsApp
🔍 Track your orders in real-time

Stay tuned for more features! 😊
```

## 🧪 Testing Examples

### 1. Send Test Message via API
```javascript
// Using JavaScript/Node.js
const axios = require('axios');

const sendTestMessage = async () => {
  try {
    const response = await axios.post(
      'https://order-ease-backend.onrender.com/api/whatsapp/send-test-message',
      {
        to: '919876543210', // Replace with test number
        message: 'Hello from OrderEase API!'
      }
    );
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

sendTestMessage();
```

### 2. Test with Postman
**POST** `https://order-ease-backend.onrender.com/api/whatsapp/send-test-message`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "to": "919876543210",
  "message": "Test message from Postman!"
}
```

### 3. Test with curl
```bash
# Send test message
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Testing WhatsApp integration!"
  }'

# Check health
curl https://order-ease-backend.onrender.com/api/whatsapp/health
```

## 🔍 Monitoring & Debugging

### Server Logs
Your server will log:
```
📨 Received webhook payload: {...}
📱 Message received from 919876543210: "Hello"
📤 Sending message to 919876543210: Welcome to OrderEase!...
✅ Message sent successfully: {...}
```

### Common Issues & Solutions

1. **Webhook verification fails**
   - Check verify token matches: `vebsdev23`
   - Ensure webhook URL is accessible
   - Check server logs for errors

2. **Messages not sending**
   - Verify access token is valid
   - Check phone number ID is correct
   - Ensure recipient number format: `919876543210`

3. **Not receiving messages**
   - Check webhook subscription in Meta console
   - Verify webhook URL is correct
   - Check server is running and accessible

## 📊 API Endpoints

### Available Endpoints
```
GET  /api/whatsapp/webhook          # Webhook verification
POST /api/whatsapp/webhook          # Incoming messages
POST /api/whatsapp/send-test-message # Send test message
GET  /api/whatsapp/health           # Health check
```

### Response Examples

**Health Check Response:**
```json
{
  "status": "OK",
  "message": "WhatsApp webhook is running",
  "timestamp": "2024-10-31T10:30:00.000Z",
  "webhookUrl": "https://order-ease-backend.onrender.com/api/whatsapp/webhook"
}
```

**Test Message Success:**
```json
{
  "success": true,
  "message": "Test message sent successfully",
  "to": "919876543210"
}
```

## 🔄 Next Steps

Once basic integration is working:

1. **Test with real WhatsApp number**
2. **Implement order parsing** (keyword detection)
3. **Add Razorpay payment links**
4. **Integrate with existing order system**
5. **Add order tracking functionality**

## 🎯 Meta Webhook Configuration

### Step-by-Step Meta Setup

1. **Login to Meta for Developers**
   - Go to https://developers.facebook.com/
   - Select your WhatsApp app

2. **Configure Webhook**
   - Navigate to WhatsApp > Configuration
   - Click "Edit" next to Webhook
   - Enter webhook URL: `https://order-ease-backend.onrender.com/api/whatsapp/webhook`
   - Enter verify token: `vebsdev23`
   - Click "Verify and Save"

3. **Subscribe to Webhook Fields**
   - Check "messages" field
   - Click "Subscribe"

4. **Test the Integration**
   - Send a message to your test WhatsApp number
   - Check your server logs for incoming message
   - Verify auto-reply is sent

## ✅ Verification Checklist

- [ ] Environment variables are set correctly
- [ ] Server is deployed and accessible
- [ ] Webhook URL responds to verification
- [ ] Meta webhook is configured
- [ ] Test message can be sent via API
- [ ] Incoming messages are logged
- [ ] Auto-replies are working

---

**Your WhatsApp webhook is ready!** 🎉

The basic integration is complete and ready for testing. Once verified, you can enhance it with order processing and payment features.