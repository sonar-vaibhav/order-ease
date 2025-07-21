import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { cartItems, customerInfo, total } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if no cart data
  if (!cartItems || !customerInfo) {
    navigate('/cart');
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Generate order ID
      const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      toast({
        title: "Payment Successful!",
        description: `Your order ${orderId} has been placed successfully.`,
      });
      
      // Navigate to confirmation
      navigate('/confirmation', { 
        state: { 
          orderId, 
          customerInfo, 
          cartItems, 
          total 
        } 
      });
    }, 2000);
  };

  const estimatedTime = cartItems.reduce((max: number, item: any) => 
    Math.max(max, item.menuItem.preparationTime), 0
  );

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
                      <span className="font-medium">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${total}</span>
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Estimated Preparation Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {estimatedTime} minutes
                    </Badge>
                    <span className="text-muted-foreground">
                      Your order will be ready for pickup
                    </span>
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
                          Pay ${total}
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