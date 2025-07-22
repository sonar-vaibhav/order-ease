import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper to load Razorpay script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { cartItems, customerInfo, total } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Redirect if no cart data
  if (!cartItems || !customerInfo) {
    navigate('/cart');
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    const res = await loadRazorpayScript();
    if (!res) {
      toast({ title: 'Razorpay SDK failed to load. Are you online?' });
      setIsProcessing(false);
      return;
    }
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await fetch(`${BACKEND_URL}/api/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'INR' })
      });
      const orderData = await orderRes.json();
      if (!orderData.id) throw new Error('Failed to create Razorpay order');

      // 2. Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'OrderEase',
        description: 'Order Payment',
        order_id: orderData.id,
        handler: async function (response) {
          // 3. On payment success, save order to backend
          const saveRes = await fetch(`${BACKEND_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cartItems.map((item) => ({
                name: item.menuItem.name,
                quantity: item.quantity,
                price: item.menuItem.price,
              })),
              customer: {
                name: customerInfo.name,
                phone: customerInfo.phone,
                address: '',
              },
              payment: {
                razorpay_order_id: orderData.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              status: 'pending',
            })
          });
          const savedOrder = await saveRes.json();
          setIsProcessing(false);
          toast({
            title: 'Payment Successful!',
            description: `Your order has been placed successfully.`,
          });
          navigate('/confirmation', {
            state: {
              orderId: savedOrder.displayOrderId || savedOrder._id || savedOrder.id,
              customerInfo,
              cartItems,
              total
            }
          });
        },
        prefill: {
          name: customerInfo.name,
          contact: customerInfo.phone,
        },
        theme: { color: '#6366f1' },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      toast({ title: 'Payment failed', description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItemsCount={cartItems.length} />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Review */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium">{item.menuItem.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {customerInfo.name}</p>
                    <p><span className="font-medium">Phone:</span> {customerInfo.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Payment */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="bg-muted p-8 rounded-lg mb-6">
                      <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Razorpay Payment</h3>
                      <p className="text-muted-foreground">
                        Secure payment processing with Razorpay
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        <strong>Test Mode:</strong> This is a demo payment. No actual charges will be made.
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay ₹{total}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    <p>By proceeding, you agree to our terms of service.</p>
                    <p className="mt-2">Your payment is secured with 256-bit SSL encryption.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}