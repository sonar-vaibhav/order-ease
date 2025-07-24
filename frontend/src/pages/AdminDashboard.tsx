import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/OrderCard";
import { OrderFilters } from "@/components/OrderFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Order, OrderStatus } from "@/types";
import { TrendingUp, DollarSign, Clock, Users, ShoppingBag, Timer, X, Edit, Trash, ImagePlus, Check, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// Dish type for admin (matches backend)
interface Dish {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  description?: string;
}

export default function AdminDashboard() {
  // Add console.log to print VITE_BACKEND_URL
  console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all');
  const [activeTab, setActiveTab] = useState("orders"); // State to track active tab

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<{ name: string; price: string; image: File | null; available: boolean; description: string }>({ name: "", price: "", image: null, available: true, description: "" });
  const [dishError, setDishError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


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

  // Helper to fetch orders from backend and update state
  const fetchOrders = () => {
    fetch(`${BACKEND_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        // Map backend orders to frontend Order type
        const mapped = data.map((order: any) => {
          // Calculate total amount
          const totalAmount = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          // Estimate time (if you have preparationTime, otherwise fallback)
          const estimatedTime = order.items.reduce((max: number, item: any) => Math.max(max, item.preparationTime || 0), 0);
          return {
            id: order.displayOrderId || order._id, // for display
            _id: order._id, // for backend API calls
            items: order.items.map((item: any) => ({
              menuItem: {
                id: item._id || '',
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category || '',
                image: item.image || '',
                available: true,
                preparationTime: item.preparationTime || 0,
              },
              quantity: item.quantity,
            })),
            customerName: order.customer?.name || '',
            customerPhone: order.customer?.phone || '',
            totalAmount,
            status: order.status,
            estimatedTime,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            timeRequired: order.timeRequired,
          };
        });
        setOrders(mapped);
      })
      .catch(() => setOrders([]));
  };

  // Fetch orders from backend
  useEffect(() => {
    if (activeTab !== "orders") return;
    fetchOrders();
  }, [activeTab]);

  // Fetch dishes from backend
  useEffect(() => {
    if (activeTab !== "dishes") return;
    setLoadingDishes(true);
    fetch(`${BACKEND_URL}/api/dishes`)
      .then(res => res.json())
      .then(data => setDishes(data))
      .catch(() => setDishes([]))
      .finally(() => setLoadingDishes(false));
  }, [activeTab]);

  // Handle form changes
  const handleDishFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | boolean) => {
    if (typeof e === "boolean") {
      setDishForm(f => ({ ...f, available: e }));
      return;
    }
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    if (name === "image" && (target as HTMLInputElement).files) {
      setDishForm(f => ({ ...f, image: (target as HTMLInputElement).files![0] }));
    } else {
      setDishForm(f => ({ ...f, [name]: value }));
    }
  };

  // Open modal for add/edit
  const openDishModal = (dish?: Dish) => {
    setEditingDish(dish || null);
    setDishForm({
      name: dish?.name || "",
      price: dish?.price?.toString() || "",
      image: null,
      available: dish?.available ?? true,
      description: dish?.description || "",
    });
    setDishError("");
    setShowDishModal(true);
  };

  // Close modal
  const closeDishModal = () => {
    setShowDishModal(false);
    setEditingDish(null);
    setDishForm({ name: "", price: "", image: null, available: true, description: "" });
    setDishError("");
  };

  // Add or update dish
  const handleDishSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDishError("");
    if (!dishForm.name || !dishForm.price) {
      setDishError("Name and price are required");
      return;
    }
    const formData = new FormData();
    formData.append("name", dishForm.name);
    formData.append("price", dishForm.price);
    if (dishForm.image) formData.append("image", dishForm.image);
    formData.append("available", String(dishForm.available));
    if (dishForm.description) formData.append("description", dishForm.description);
    try {
      let res;
      if (editingDish) {
        res = await fetch(`${BACKEND_URL}/api/dishes/${editingDish._id}`, {
          method: "PATCH",
          body: formData,
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/dishes`, {
          method: "POST",
          body: formData,
        });
      }
      const contentType = res.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.error || "Error");
      // Refresh list
      fetch(`${BACKEND_URL}/api/dishes`)
        .then(res => res.json())
        .then(data => setDishes(data));
      closeDishModal();
    } catch (err: any) {
      setDishError(err.message);
    }
  };

  // Delete dish
  const handleDeleteDish = async (id: string) => {
    if (!window.confirm("Delete this dish?")) return;
    const res = await fetch(`${BACKEND_URL}/api/dishes/${id}`, { method: "DELETE" });
    const contentType = res.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }
    if (res.ok) {
      setDishes(dishes => dishes.filter(d => d._id !== id));
    } else {
      alert(data?.error || "Failed to delete dish");
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedOrder = await res.json();
      if (!res.ok) throw new Error(updatedOrder.error || 'Failed to update status');
      // Re-fetch orders to get latest data
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message || String(error),
        variant: "destructive"
      });
      console.error("Failed to update status:", error);
    }
  };

  const handleTimeRequiredUpdate = async (orderId: string, timeRequired: number | null) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRequired }),
      });
      const updatedOrder = await res.json();
      if (!res.ok) throw new Error(updatedOrder.error || 'Failed to update time');
      // Re-fetch orders to get latest data
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Failed to update time required",
        description: error.message || String(error),
        variant: "destructive"
      });
      console.error("Failed to update time required:", error);
    }
  };


  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const activeOrders = orders.filter(order => order.status !== 'picked');
  const completedOrders = orders.filter(order => order.status === 'picked');
  
  // Filter orders based on active filter
  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);
  
  // Calculate order counts for filters
  const orderCounts = {
    all: orders.length,
    queued: orders.filter(o => o.status === 'queued').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    picked: orders.filter(o => o.status === 'picked').length,
  };

  // --- Analytics Calculations ---
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const ordersToday = orders.filter(order => order.createdAt.toISOString().slice(0, 10) === today);
  const todayOrdersCount = ordersToday.length;
  const todayRevenue = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

  // Top Dishes (by count in all orders)
  const dishOrderCounts: Record<string, { name: string, count: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const name = item.menuItem.name;
      if (!dishOrderCounts[name]) dishOrderCounts[name] = { name, count: 0 };
      dishOrderCounts[name].count += item.quantity;
    });
  });
  const topDishes = Object.values(dishOrderCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const mostOrderedItem = topDishes[0]?.name || '';

  // Weekly Orders (last 7 days)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const weeklyOrders = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter(order => order.createdAt.toISOString().slice(0, 10) === dateStr);
    return {
      day: daysOfWeek[d.getDay()],
      date: dateStr,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });

  // Orders by Status
  const statusList = ['queued', 'preparing', 'ready', 'picked'];
  const ordersByStatus = statusList.map(status => ({
    status,
    count: orders.filter(order => order.status === status).length
  }));

  // Average Preparation Time (for orders with timeRequired)
  const prepTimes = orders.filter(o => o.timeRequired).map(o => o.timeRequired!);
  const avgPrepTime = prepTimes.length > 0 ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0;

  // Chart colors - updated for new status colors
  const COLORS = ['hsl(var(--status-queued))', 'hsl(var(--status-preparing))', 'hsl(var(--status-ready))', 'hsl(var(--status-picked))'];

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
      

        <Tabs
          defaultValue="orders"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="dishes">Dish Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-2xl font-bold">{todayOrdersCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Today's Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">₹{todayRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Avg Order Value</span>
                  </div>
                  <p className="text-2xl font-bold">₹{averageOrderValue}</p>
                </CardContent>
              </Card>
            </div>

            {/* Order Filters */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">Order Management</h2>
                <OrderFilters 
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  orderCounts={orderCounts}
                />
              </div>
              
              {filteredOrders.length > 0 ? (
                <div className="grid gap-4">
                  {filteredOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={(orderId, status) => handleStatusUpdate(order._id, status)}
                      onTimeRequiredUpdate={(orderId, timeRequired) => handleTimeRequiredUpdate(order._id, timeRequired)}
                      showActions={order.status !== 'picked'}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">
                      No {activeFilter === 'all' ? '' : activeFilter} orders
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

          </TabsContent>

          <TabsContent value="dishes" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Dish Management</h2>
              <Button onClick={() => openDishModal()}>Add Dish</Button>
            </div>
            {loadingDishes ? (
              <div className="text-center py-8">Loading...</div>
            ) : dishes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-xl text-muted-foreground">No dishes found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dishes.map(dish => (
                  <Card key={dish._id} className="relative group">
                    {dish.imageUrl && (
                      <img src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `${BACKEND_URL}${dish.imageUrl}`} alt={dish.name} className="w-full h-40 object-cover rounded-t-lg" />
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{dish.name}</CardTitle>
                      {dish.description && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{dish.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex items-center justify-between pb-2">
                      <span className="text-xl font-bold text-primary">₹{dish.price}</span>
                    </CardContent>
                    
                    <div className="absolute top-2 right-2 flex gap-2 transition">
                      <Button size="icon" variant="default" onClick={() => openDishModal(dish)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteDish(dish._id)}><Trash className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {/* Modal for Add/Edit Dish */}
            {showDishModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <Card className="w-full max-w-md mx-2 p-0 rounded-xl shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between p-6 pb-2 border-b">
                    <CardTitle className="text-xl font-bold">{editingDish ? "Edit Dish" : "Add Dish"}</CardTitle>
                    <Button size="icon" variant="ghost" onClick={closeDishModal}><X className="w-5 h-5" /></Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleDishSubmit} className="space-y-5">
                      <div>
                        <Label htmlFor="dish-name">Name</Label>
                        <Input id="dish-name" type="text" name="name" value={dishForm.name} onChange={handleDishFormChange} required autoFocus />
                      </div>
                      <div>
                        <Label htmlFor="dish-description">Description</Label>
                        <textarea
                          id="dish-description"
                          name="description"
                          value={dishForm.description || ""}
                          onChange={handleDishFormChange}
                          className="w-full border rounded p-2 min-h-[60px]"
                          placeholder="Enter dish description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dish-price">Price</Label>
                        <Input id="dish-price" type="number" name="price" value={dishForm.price} onChange={handleDishFormChange} min="0" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="dish-image">Image</Label>
                        <Input id="dish-image" type="file" name="image" accept="image/*" onChange={handleDishFormChange} />
                        {editingDish && editingDish.imageUrl && (
                          <img src={editingDish.imageUrl.startsWith('http') ? editingDish.imageUrl : `${BACKEND_URL}${editingDish.imageUrl}`} alt="Current" className="w-24 h-24 object-cover mt-2 rounded border" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="dish-available">Available</Label>
                        <Switch id="dish-available" checked={dishForm.available} onCheckedChange={val => handleDishFormChange(val)} />
                        <span className="text-sm text-muted-foreground">{dishForm.available ? "Yes" : "No"}</span>
                      </div>
                      {dishError && <div className="text-red-500 text-sm">{dishError}</div>}
                      <Button type="submit" className="w-full">{editingDish ? "Update" : "Add"} Dish</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Top Dishes Today</span>
                  </div>
                  <div className="space-y-2">
                    {topDishes.map((dish, index) => (
                      <div key={dish.name} className="flex justify-between text-sm">
                        <span className="truncate">{index + 1}. {dish.name}</span>
                        <span className="font-medium">{dish.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Timer className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Avg Prep Time</span>
                  </div>
                  <p className="text-3xl font-bold text-warning">{avgPrepTime}m</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From order to ready
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Order Queue</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Queued</span>
                      <span className="font-medium">{orderCounts.queued}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Preparing</span>
                      <span className="font-medium">{orderCounts.preparing}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ready</span>
                      <span className="font-medium">{orderCounts.ready}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Orders Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Orders']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [`₹${value}`, 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

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
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="status"
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 mt-4">
                    {ordersByStatus.map((entry, index) => (
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
                    <span className="font-bold">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-bold">₹{totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Most Ordered Item</span>
                    <span className="font-bold">{mostOrderedItem}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Average Order Value</span>
                    <span className="font-bold">₹{averageOrderValue}</span>
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