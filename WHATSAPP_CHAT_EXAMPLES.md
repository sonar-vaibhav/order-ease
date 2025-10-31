# WhatsApp Chat Flow Examples

## 📱 Sample Chat Conversations

### 1. Complete Order Flow

```
👤 Customer: Hi

🤖 OrderEase Bot:
👋 Welcome to *OrderEase*!

🍽️ Type "menu" to see our menu
📝 Type "I want [items]" to place an order
🔍 Type "track [OrderID]" to track your order

Example: "I want 2 Pizza and 1 Coke"

Need help? Just ask! 😊

---

👤 Customer: menu

🤖 OrderEase Bot:
🍽️ *OrderEase Menu*

1. *Pizza* - ₹250
   Delicious cheese pizza with fresh toppings

2. *Burger* - ₹150
   Juicy beef burger with fries

3. *Coke* - ₹50
   Refreshing cold drink

4. *Pasta* - ₹200
   Creamy alfredo pasta

📝 *To place an order, reply with:*
Example: "I want 2 Pizza and 1 Coke"

📞 Need help? Just ask!

---

👤 Customer: I want 2 pizza and 1 coke

🤖 OrderEase Bot:
🛒 *Order Summary*

• Pizza x2 - ₹500
• Coke x1 - ₹50

💰 *Total: ₹550*

📝 Please provide your details:
Reply with: Name, Phone, Address
Example: "John Doe, 9876543210, 123 Main St"

---

👤 Customer: John Doe, 9876543210, 123 Main Street, Mumbai

🤖 OrderEase Bot:
✅ *Order Confirmed!*

👤 Name: John Doe
📞 Phone: 9876543210
📍 Address: 123 Main Street, Mumbai

💰 Total Amount: ₹550

💳 *Complete your payment:*
https://rzp.io/l/test_payment_link_xyz

⚠️ This is a test payment link. Use test card details.

---

[After payment completion]

🤖 OrderEase Bot:
🎉 *Payment Successful!*

✅ Your order has been placed successfully.
📋 Order ID: 20241031-001

👨‍🍳 Your order is now being prepared.
⏱️ Estimated preparation time: 15-30 minutes

🔍 Track your order anytime by sending: *20241031-001*

Thank you for choosing OrderEase! 😊
```

### 2. Order Tracking Flow

```
👤 Customer: track order

🤖 OrderEase Bot:
🔍 Please provide your Order ID to track your order.

Example: 20241031-001

---

👤 Customer: 20241031-001

🤖 OrderEase Bot:
👨‍🍳 *Order Status: Being Prepared*

📋 Order ID: 20241031-001
👤 Customer: John Doe
📞 Phone: 9876543210

🍽️ *Items:*
• Pizza x2 - ₹500
• Coke x1 - ₹50

💰 Total: ₹550
⏱️ Estimated time: 20 minutes
📅 Ordered: 31/10/2024 02:30 PM
```

### 3. Status Update Notifications

```
🤖 OrderEase Bot:
👨‍🍳 *Order Status Updated*

📋 Order ID: 20241031-001
🔄 Status: Being Prepared

👨‍🍳 Your order is being prepared.
⏱️ Estimated time: 20 minutes

Thank you for your patience! 😊

---

[Later...]

🤖 OrderEase Bot:
✅ *Order Status Updated*

📋 Order ID: 20241031-001
🔄 Status: Ready for Pickup

🎉 Your order is ready for pickup!
📍 Please collect from the restaurant.

Thank you for your patience! 😊
```

### 4. Error Handling Examples

```
👤 Customer: I want 5 burrito

🤖 OrderEase Bot:
❌ Could not understand your order. Please try again.

📝 Example: "I want 2 Pizza and 1 Coke"

Type "menu" to see available items.

---

👤 Customer: track 12345

🤖 OrderEase Bot:
❌ Invalid Order ID format. Please provide a valid Order ID (e.g., 20241031-001)

---

👤 Customer: track 20241031-999

🤖 OrderEase Bot:
❌ Order 20241031-999 not found. Please check your Order ID and try again.
```

### 5. Quick Help Responses

```
👤 Customer: help

🤖 OrderEase Bot:
👋 Welcome to *OrderEase*!

🍽️ Type "menu" to see our menu
📝 Type "I want [items]" to place an order
🔍 Type "track [OrderID]" to track your order

Example: "I want 2 Pizza and 1 Coke"

Need help? Just ask! 😊

---

👤 Customer: what can I order?

🤖 OrderEase Bot:
🍽️ *OrderEase Menu*

1. *Pizza* - ₹250
2. *Burger* - ₹150
3. *Coke* - ₹50
4. *Pasta* - ₹200

📝 *To place an order, reply with:*
Example: "I want 2 Pizza and 1 Coke"
```

## 🔧 Technical Message Patterns

### Supported Order Patterns
- "I want 2 pizza and 1 coke"
- "Order 1 burger and 2 coke"
- "Can I get 3 pasta"
- "2 pizza please"

### Supported Tracking Patterns
- "track 20241031-001"
- "track order 20241031-001"
- "20241031-001" (direct order ID)
- "track order"

### Supported Menu Patterns
- "menu"
- "show menu"
- "what's available"
- "list items"

## 📊 Message Flow States

### Order States
1. **Initial Contact** → Welcome message
2. **Menu Request** → Show menu
3. **Order Request** → Parse items, show summary
4. **Pending Details** → Wait for customer info
5. **Payment Link** → Send Razorpay link
6. **Payment Success** → Create order, send confirmation

### Tracking States
1. **Track Request** → Ask for Order ID
2. **Order ID Provided** → Show order status
3. **Invalid Order ID** → Error message

## 🎯 Best Practices for Customers

### Placing Orders
- Use simple language: "I want [quantity] [item]"
- Separate multiple items with "and"
- Provide complete address details
- Use the format: "Name, Phone, Address"

### Tracking Orders
- Keep your Order ID safe
- Order ID format: YYYYMMDD-XXX (e.g., 20241031-001)
- You can track anytime by sending just the Order ID

### Getting Help
- Type "menu" to see available items
- Type "help" for assistance
- Use simple, clear messages

## 🔄 Automated Notifications

Customers automatically receive notifications for:
- Order confirmation after payment
- Status updates (preparing, ready, picked up)
- Payment confirmations
- Error messages for invalid requests

## 📱 Testing Commands

For testing purposes, these additional patterns work:
- "test order" - Creates a sample order
- "status update" - Simulates status change
- "payment test" - Tests payment flow

---

**Note**: All examples use test data and test payment links. In production, real payment processing and order management will be used.