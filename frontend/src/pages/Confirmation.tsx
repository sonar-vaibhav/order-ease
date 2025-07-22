import { useLocation, Link } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Phone, User, Receipt } from "lucide-react";

export default function Confirmation() {
  const location = useLocation();
  const { orderId, customerInfo, cartItems, total } = location.state || {};

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Order not found</h1>
            <Link to="/menu">
              <Button>Return to Menu</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-xl text-muted-foreground">
              Thank you for your order. We'll have it ready soon!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5" />
                  <span>Order Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-2xl font-bold text-primary">{orderId}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{customerInfo?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customerInfo?.phone}</span>
                  </div>
                  {location.state?.timeRequired ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Estimated: {location.state.timeRequired} minutes</span>
                    </div>
                  ) : null}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span className="text-primary">₹{total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium">{item.menuItem.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Actions */}
          <Card className="mt-8">
            <CardContent className="py-8">
              <div className="text-center space-y-6">
                <div>
                  <Badge className="bg-warning text-warning-foreground text-lg px-4 py-2">
                    Status: Queued
                  </Badge>
                  <p className="text-muted-foreground mt-2">
                    Your order is in the queue and will be prepared shortly.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={`/track/${orderId}`}>
                    <Button variant="outline" size="lg">
                      Track Your Order
                    </Button>
                  </Link>
                  <Link to="/menu">
                    <Button size="lg">
                      Order Again
                    </Button>
                  </Link>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>We'll update your order status in real-time.</p>
                  <p>You can track your order using the Order ID: <strong>{orderId}</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}