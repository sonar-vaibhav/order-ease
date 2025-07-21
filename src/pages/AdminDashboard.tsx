import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockOrders, mockAnalytics } from "@/data/mockData";
import { Order } from "@/types";
import { TrendingUp, DollarSign, Clock, Users } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const authState = localStorage.getItem('adminAuth');
    if (authState === 'true') {
      setIsAuthenticated(true);
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order
      )
    );
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const activeOrders = orders.filter(order => order.status !== 'ready');
  const completedOrders = orders.filter(order => order.status === 'ready');

  // Chart colors
  const COLORS = ['#f97316', '#dc2626', '#16a34a'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAdmin onLogout={handleLogout} />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Restaurant Dashboard</h1>
          <p className="text-muted-foreground">
            Manage orders and view analytics for your restaurant
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Active Orders</span>
                  </div>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Today's Orders</span>
                  </div>
                  <p className="text-2xl font-bold">{mockAnalytics.todayOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Today's Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">$498.70</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Avg Order Value</span>
                  </div>
                  <p className="text-2xl font-bold">${mockAnalytics.averageOrderValue}</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Orders */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Orders</h2>
              {activeOrders.length > 0 ? (
                <div className="grid gap-4">
                  {activeOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                      showActions
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-xl text-muted-foreground">No active orders</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Completed Orders */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recently Completed</h2>
              {completedOrders.length > 0 ? (
                <div className="grid gap-4">
                  {completedOrders.slice(0, 3).map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-xl text-muted-foreground">No completed orders today</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAnalytics.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`$${value}`, 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Orders by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={mockAnalytics.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="status"
                      >
                        {mockAnalytics.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 mt-4">
                    {mockAnalytics.ordersByStatus.map((entry, index) => (
                      <div key={entry.status} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm capitalize">{entry.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-bold">{mockAnalytics.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-bold">${mockAnalytics.totalRevenue}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Most Ordered Item</span>
                    <span className="font-bold">{mockAnalytics.mostOrderedItem}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Average Order Value</span>
                    <span className="font-bold">${mockAnalytics.averageOrderValue}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}