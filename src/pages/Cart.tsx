import { useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CartItem } from "@/types";
import { mockMenuItems } from "@/data/mockData";

export default function Cart() {
  const navigate = useNavigate();
  
  // Mock cart items (in real app, this would come from context/state)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { menuItem: mockMenuItems[0], quantity: 2 },
    { menuItem: mockMenuItems[2], quantity: 1 }
  ]);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: ""
  });

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.menuItem.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill in your contact information");
      return;
    }
    
    // Navigate to checkout with order data
    navigate('/checkout', { 
      state: { 
        cartItems, 
        customerInfo, 
        total: total.toFixed(2) 
      } 
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartItemsCount={0} />
        
        <main className="container py-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Add some delicious items from our menu to get started!
            </p>
            <Link to="/menu">
              <Button size="lg">Browse Menu</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItemsCount={cartItems.length} />
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.menuItem.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={item.menuItem.image} 
                        alt={item.menuItem.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.menuItem.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{item.menuItem.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{item.menuItem.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.menuItem.preparationTime}m prep time
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="font-bold text-lg">
                          ${(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.menuItem.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Order Summary & Customer Info */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}