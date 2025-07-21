import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/OrderCard";
import { Search, Clock } from "lucide-react";
import { mockOrders } from "@/data/mockData";

export default function TrackOrder() {
  const { orderId } = useParams();
  const [searchOrderId, setSearchOrderId] = useState(orderId || "");
  const [currentOrder, setCurrentOrder] = useState(
    orderId ? mockOrders.find(order => order.id === orderId) : null
  );

  const handleSearch = () => {
    const foundOrder = mockOrders.find(order => order.id === searchOrderId);
    setCurrentOrder(foundOrder || null);
  };

  const getOrderProgress = (status: string) => {
    const stages = ['queued', 'preparing', 'ready'];
    const currentIndex = stages.indexOf(status);
    return stages.map((stage, index) => ({
      stage,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>
          
          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Order ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    placeholder="e.g., ORD-001"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Results */}
          {currentOrder ? (
            <div className="space-y-8">
              {/* Order Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    {getOrderProgress(currentOrder.status).map((item, index) => (
                      <div key={item.stage} className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          item.completed 
                            ? item.active 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.completed ? (
                            item.active ? (
                              <Clock className="w-6 h-6" />
                            ) : (
                              "✓"
                            )
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`font-medium text-sm ${
                            item.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {item.stage === 'queued' && 'Queued'}
                            {item.stage === 'preparing' && 'Preparing'}
                            {item.stage === 'ready' && 'Ready'}
                          </p>
                        </div>
                        {index < 2 && (
                          <div className={`absolute h-0.5 w-20 mt-6 ${
                            getOrderProgress(currentOrder.status)[index + 1]?.completed 
                              ? 'bg-success' 
                              : 'bg-muted'
                          }`} style={{ marginLeft: '60px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    {currentOrder.status === 'ready' ? (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <Badge className="bg-success text-success-foreground mb-2">
                          Ready for Pickup!
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Your order is ready. Please come to the restaurant to collect it.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <Badge className="bg-warning text-warning-foreground mb-2">
                          Estimated Time: {currentOrder.estimatedTime} minutes
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          We're working on your order. You'll be notified when it's ready.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <OrderCard order={currentOrder} />
            </div>
          ) : searchOrderId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-xl text-muted-foreground mb-4">
                  Order not found
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your Order ID and try again.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">
                  Enter your Order ID to track your order
                </p>
                <p className="text-sm text-muted-foreground">
                  You can find your Order ID in the confirmation email or message.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}