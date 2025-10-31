# WhatsApp Integration Setup Guide for OrderEase

## 🚀 Overview

This guide will help you integrate WhatsApp ordering and tracking functionality into your OrderEase restaurant management system. Customers can place orders, make payments, and track orders directly through WhatsApp.

## 📋 Prerequisites

- Existing OrderEase backend running
- Meta Developer Account
- Razorpay Test Account
- Node.js and npm installed

## 🛠️ Step 1: WhatsApp Cloud API Setup

### 1.1 Create Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a developer account if you don't have one
3. Create a new app and select "Business" as the app type

### 1.2 Configure WhatsApp Business API
1. In your Meta app dashboard, add "WhatsApp" product
2. Go to WhatsApp > Getting Started
3. Note down your:
   - **Phone Number ID** (from the test phone number)
   - **Access Token** (temporary token for testing)
   - Create a **Verify Token** (any random string you choose)

### 1.3 Set Up Webhook
1. In WhatsApp > Configuration, set up webhook:
   - **Webhook URL**: `https://your-backend-url.com/api/whatsapp/webhook`
   - **Verify Token**: Use the same token you created above
   - Subscribe to `messages` webhook field

## 🛠️ Step 2: Razorpay Configuration

### 2.1 Get Test API Keys
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch to "Test Mode"
3. Go to Settings > API Keys
4. Generate and note down:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### 2.2 Configure Webhooks
1. Go to Settings > Webhooks
2. Create a new webhook:
   - **URL**: `https://your-backend-url.com/api/whatsapp/razorpay-webhook`
   - **Events**: Select `payment_link.paid`, `payment.captured`, `payment.failed`
   - **Secret**: Generate a webhook secret

## 🛠️ Step 3: Backend Configuration

### 3.1 Install Dependencies
```bash
cd backend
npm install axios
```

### 3.2 Environment Variables
Update your `.env` file with the following variables:

```env
# Existing variables...
MONGODB_URI=your_mongodb_connection_string
RAZORPAY_KEY_ID=your_existing_razorpay_key_id
RAZORPAY_KEY_SECRET=your_existing_razorpay_key_secret

# New WhatsApp Integration Variables
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_APP_SECRET=your_whatsapp_app_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
BACKEND_URL=https://your-backend-url.com
```

### 3.3 Verify Integration Files
Ensure these files are created in your backend:
- `src/whatsapp/whatsappController.js`
- `src/whatsapp/whatsappService.js`
- `src/whatsapp/razorpayWebhook.js`
- `src/models/WhatsAppOrder.js`
- `src/routes/whatsappRoutes.js`

## 🛠️ Step 4: Testing Locally

### 4.1 Use ngrok for Local Testing
```bash
# Install ngrok globally
npm install -g ngrok

# Start your backend server
npm start

# In another terminal, expose your local server
ngrok http 5000
```

### 4.2 Update Webhook URLs
Use the ngrok URL to update webhook URLs in:
- Meta Developer Console (WhatsApp webhook)
- Razorpay Dashboard (webhook URL)
- Your `.env` file (`BACKEND_URL`)

### 4.3 Test Message Flow
1. Send a message to your WhatsApp test number: "Hi"
2. You should receive a welcome message with menu options
3. Try: "I want 2 pizza and 1 coke"
4. Follow the flow to provide customer details
5. Complete the test payment

## 🛠️ Step 5: Deployment on Render

### 5.1 Update Environment Variables
In your Render dashboard, add all the WhatsApp-related environment variables.

### 5.2 Update Webhook URLs
Replace ngrok URLs with your actual Render backend URL:
- WhatsApp webhook: `https://your-render-backend.onrender.com/api/whatsapp/webhook`
- Razorpay webhook: `https://your-render-backend.onrender.com/api/whatsapp/razorpay-webhook`

### 5.3 Deploy Changes
```bash
git add .
git commit -m "Add WhatsApp integration"
git push origin main
```

## 📱 Customer Usage Flow

### Placing an Order
1. **Customer**: "Hi" or "Menu"
2. **Bot**: Shows menu and instructions
3. **Customer**: "I want 2 Pizza and 1 Coke"
4. **Bot**: Shows order summary, asks for details
5. **Customer**: "John Doe, 9876543210, 123 Main St"
6. **Bot**: Sends Razorpay payment link
7. **Customer**: Completes payment
8. **Bot**: Confirms order with Order ID

### Tracking an Order
1. **Customer**: "Track 20241031-001" or "Track order"
2. **Bot**: Shows current order status and details

## 🧪 Test Message Examples

### Test Order Flow
```
Customer: "Hi"
Bot: Welcome message with menu options

Customer: "menu"
Bot: Shows full menu with prices

Customer: "I want 2 pizza and 1 coke"
Bot: Order summary and request for details

Customer: "John Doe, 9876543210, 123 Main Street"
Bot: Payment link

[After payment completion]
Bot: Order confirmation with Order ID
```

### Test Tracking Flow
```
Customer: "track order"
Bot: Asks for Order ID

Customer: "20241031-001"
Bot: Shows order status and details
```

## 🔧 API Endpoints

### WhatsApp Endpoints
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Incoming messages
- `POST /api/whatsapp/razorpay-webhook` - Payment webhooks
- `GET /api/whatsapp/payment-success` - Payment success page

### Testing Endpoints
- `POST /api/whatsapp/send-test-message` - Send test message
- `GET /api/whatsapp/orders/:phoneNumber` - Get orders by phone
- `GET /api/whatsapp/stats` - WhatsApp order statistics
- `POST /api/whatsapp/update-order-status` - Manual status update

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL is accessible
   - Verify webhook token matches
   - Check server logs for errors

2. **Payment link not working**
   - Verify Razorpay test mode is enabled
   - Check API keys are correct
   - Ensure webhook secret matches

3. **Messages not sending**
   - Verify WhatsApp access token is valid
   - Check phone number ID is correct
   - Ensure recipient number is in correct format

### Debug Commands

```bash
# Test WhatsApp message sending
curl -X POST http://localhost:5000/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "message": "Test message"}'

# Check WhatsApp orders
curl http://localhost:5000/api/whatsapp/orders/919876543210

# Get statistics
curl http://localhost:5000/api/whatsapp/stats
```

## 🔒 Security Considerations

1. **Webhook Signature Verification**: Enabled for both WhatsApp and Razorpay
2. **Environment Variables**: Never commit sensitive tokens to git
3. **Test Mode Only**: Current setup uses test APIs only
4. **Rate Limiting**: Consider implementing rate limiting for production

## 📈 Production Checklist

Before going live:
- [ ] Replace test tokens with production tokens
- [ ] Set up proper webhook signature verification
- [ ] Implement rate limiting
- [ ] Add comprehensive error handling
- [ ] Set up monitoring and logging
- [ ] Test with real phone numbers
- [ ] Configure proper CORS settings
- [ ] Set up backup webhook endpoints

## 🎯 Next Steps

1. Test the complete flow in your development environment
2. Deploy to Render and test with the live URLs
3. Add more sophisticated order parsing
4. Implement order modification features
5. Add multi-language support
6. Create admin dashboard for WhatsApp orders

## 📞 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test webhook endpoints manually using curl or Postman
4. Check Meta Developer Console for webhook delivery status

---

**Note**: This integration is designed for test/sandbox mode. For production deployment, ensure you have proper WhatsApp Business API approval and use production Razorpay keys.