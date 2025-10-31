# WhatsApp Integration - Quick Start Guide

## 🎯 What You Asked For - DELIVERED ✅

I've created exactly what you requested:

### ✅ Express Route `/api/whatsapp/webhook`
- **GET request**: Handles webhook verification (responds with `hub.challenge` if verify token matches)
- **POST request**: Receives incoming messages and logs them to console
- **Auto-reply**: Sends welcome message when users message for the first time

### ✅ Environment Variables
```env
WHATSAPP_VERIFY_TOKEN=vebsdev23
WHATSAPP_ACCESS_TOKEN=<your temporary test token from Meta>
```

### ✅ Webhook URL Ready
```
https://order-ease-backend.onrender.com/api/whatsapp/webhook
```

## 🚀 Ready to Deploy

Your code is ready! Here's what to do:

### 1. Deploy Your Code
```bash
git add .
git commit -m "Add WhatsApp webhook integration"
git push origin main
```

### 2. Configure Meta Webhook
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your WhatsApp app
3. Go to **WhatsApp > Configuration**
4. Set webhook:
   - **URL**: `https://order-ease-backend.onrender.com/api/whatsapp/webhook`
   - **Verify Token**: `vebsdev23`
   - **Subscribe to**: `messages`

### 3. Test It Works
```bash
# Test webhook verification
curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"

# Send test message
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "message": "Hello from OrderEase!"}'
```

## 📱 How It Works

### Customer Experience
1. **Customer sends**: "Hello" to your WhatsApp test number
2. **Your server logs**: `📱 Message received from 919876543210: "Hello"`
3. **Auto-reply sent**: Welcome message with OrderEase info

### Sample Auto-Reply
```
👋 Welcome to *OrderEase*!

Thank you for contacting us. We received your message: "Hello"

🍽️ We're a restaurant order management system
📝 Soon you'll be able to place orders directly through WhatsApp
🔍 Track your orders in real-time

Stay tuned for more features! 😊
```

## 🧪 Test Your Integration

### Run Test Script
```bash
cd backend
node test-simple-whatsapp.js
```

### Manual Testing
```bash
# Health check
curl https://order-ease-backend.onrender.com/api/whatsapp/health

# Send message
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "message": "Test message!"}'
```

## 📁 Files Created

### Core Implementation
- `backend/src/whatsapp/simpleWebhook.js` - Main webhook logic
- `backend/src/routes/simpleWhatsappRoutes.js` - API routes
- `backend/test-simple-whatsapp.js` - Test script

### Documentation
- `SIMPLE_WHATSAPP_SETUP.md` - Complete setup guide
- `CURL_EXAMPLES.md` - Testing commands
- `WHATSAPP_QUICK_START.md` - This file

### Updated Files
- `backend/server.js` - Added simple webhook routes
- `backend/.env.example` - Updated with your tokens

## 🔧 API Endpoints

```
GET  /api/whatsapp/webhook          # Webhook verification
POST /api/whatsapp/webhook          # Incoming messages  
POST /api/whatsapp/send-test-message # Send test message
GET  /api/whatsapp/health           # Health check
```

## 🎯 Meta Webhook Setup Steps

1. **Login to Meta for Developers**
   - https://developers.facebook.com/

2. **Go to Your WhatsApp App**
   - Select your business app

3. **Configure Webhook**
   - WhatsApp > Configuration
   - Edit webhook settings:
     - **URL**: `https://order-ease-backend.onrender.com/api/whatsapp/webhook`
     - **Verify Token**: `vebsdev23`
   - Subscribe to `messages` field

4. **Test Connection**
   - Meta will verify your webhook automatically
   - Check server logs for verification success

## 🔍 Troubleshooting

### Common Issues

1. **Webhook verification fails**
   ```bash
   # Test manually
   curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"
   ```

2. **Messages not sending**
   ```bash
   # Check access token and phone number ID
   curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
     -H "Content-Type: application/json" \
     -d '{"to": "919876543210", "message": "Test"}'
   ```

3. **Not receiving messages**
   - Check webhook subscription in Meta console
   - Verify webhook URL is accessible
   - Check server logs for incoming requests

## 📊 Server Logs to Watch

When everything works, you'll see:
```
📨 Received webhook payload: {...}
📱 Message received from 919876543210: "Hello"
📤 Sending message to 919876543210: Welcome to OrderEase!...
✅ Message sent successfully: {...}
```

## 🚀 Next Steps (Future Enhancements)

Once basic integration works:

1. **Add keyword detection** for orders ("pizza", "burger")
2. **Integrate Razorpay** payment links in messages
3. **Connect to existing order system**
4. **Add order tracking** functionality
5. **Implement promotional** messaging

## ✅ Verification Checklist

- [ ] Code deployed to Render
- [ ] Webhook URL accessible
- [ ] Meta webhook configured
- [ ] Webhook verification passes
- [ ] Test message sends successfully
- [ ] Incoming messages logged
- [ ] Auto-replies working

---

## 🎉 You're Ready!

Your WhatsApp webhook integration is complete and ready for testing. The basic foundation is in place - now you can enhance it with order processing and payment features as needed.

**Webhook URL**: `https://order-ease-backend.onrender.com/api/whatsapp/webhook`
**Verify Token**: `vebsdev23`

Test it and let me know how it goes! 🚀