# WhatsApp Integration - cURL Examples

## 🧪 Testing Your WhatsApp Integration

Use these cURL commands to test your WhatsApp webhook integration.

### 1. Test Webhook Verification

```bash
# Test webhook verification (what Meta will do)
curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"

# Expected response: test123
```

### 2. Test Health Check

```bash
# Check if webhook is running
curl https://order-ease-backend.onrender.com/api/whatsapp/health

# Expected response:
# {
#   "status": "OK",
#   "message": "WhatsApp webhook is running",
#   "timestamp": "2024-10-31T10:30:00.000Z",
#   "webhookUrl": "https://order-ease-backend.onrender.com/api/whatsapp/webhook"
# }
```

### 3. Send Test Message

```bash
# Send a test message to WhatsApp
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Hello from OrderEase! This is a test message."
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Test message sent successfully",
#   "to": "919876543210"
# }
```

### 4. Simulate Incoming Message

```bash
# Simulate an incoming WhatsApp message (what Meta sends to your webhook)
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919876543210",
            "id": "wamid.test123",
            "text": {
              "body": "Hello OrderEase!"
            },
            "type": "text"
          }]
        }
      }]
    }]
  }'

# Expected response: OK
# Check your server logs to see the message processing
```

## 🔧 Local Testing (if running locally)

If you're testing locally with ngrok:

```bash
# Replace the URL with your ngrok URL
export WEBHOOK_URL="https://your-ngrok-url.ngrok.io"

# Test webhook verification
curl "${WEBHOOK_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"

# Test health check
curl ${WEBHOOK_URL}/api/whatsapp/health

# Send test message
curl -X POST ${WEBHOOK_URL}/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Local test message!"
  }'
```

## 📱 WhatsApp Cloud API Examples

### Send Message Directly to WhatsApp API

```bash
# Send message directly using WhatsApp Cloud API
curl -X POST "https://graph.facebook.com/v18.0/833339916533428/messages" \
  -H "Authorization: Bearer EAAMT8OZBPzCsBP5z17WiIqCXZApfhSbZCrSkjVw8ECnhYmpNe3IZApVbtyfc8N9oNSyWQFxAedJqSu5qX105Ccb9cftkDIz6zDysBY85pDANzsfWiQjirQWZCdgVbU2Esgs6i2TUkHD59m5a5sKQGuREH5TWC4ZBenzwz4vgXbTJzo5rVkm7iZCSKgLpWqyGKS5FPugzkcZCjs7O9j2iWuKz8C8vevnXjgYnydXQrMDEpgIAMdK8KfSF4L7diNclsgTHtTRlUlZAUoB1wFZAYdZCaaZCqqsZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {
      "body": "Direct message from WhatsApp API!"
    }
  }'
```

## 🐛 Debugging Commands

### Check Server Status

```bash
# Check if your backend is running
curl -I https://order-ease-backend.onrender.com/

# Check specific endpoint
curl -I https://order-ease-backend.onrender.com/api/whatsapp/health
```

### Test with Verbose Output

```bash
# Test with verbose output to see full request/response
curl -v "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"

# Test message sending with verbose output
curl -v -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Verbose test message"
  }'
```

### Test Error Cases

```bash
# Test with wrong verify token (should return 403)
curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test123"

# Test message without required fields (should return 400)
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Missing phone number"
  }'
```

## 📋 Testing Checklist

Use this checklist to verify your integration:

```bash
# 1. Webhook verification ✅
curl "https://order-ease-backend.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=vebsdev23&hub.challenge=test123"

# 2. Health check ✅
curl https://order-ease-backend.onrender.com/api/whatsapp/health

# 3. Send test message ✅
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/send-test-message \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "message": "Test message"}'

# 4. Simulate incoming message ✅
curl -X POST https://order-ease-backend.onrender.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919876543210",
            "id": "test123",
            "text": {"body": "Hello"},
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

## 🎯 Expected Results

### Successful Webhook Verification
```
test123
```

### Successful Health Check
```json
{
  "status": "OK",
  "message": "WhatsApp webhook is running",
  "timestamp": "2024-10-31T10:30:00.000Z",
  "webhookUrl": "https://order-ease-backend.onrender.com/api/whatsapp/webhook"
}
```

### Successful Message Send
```json
{
  "success": true,
  "message": "Test message sent successfully",
  "to": "919876543210"
}
```

### Server Logs (when message is received)
```
📨 Received webhook payload: {...}
📱 Message received from 919876543210: "Hello"
📤 Sending message to 919876543210: Welcome to OrderEase!...
✅ Message sent successfully
```

---

**Use these commands to test your WhatsApp integration step by step!** 🧪