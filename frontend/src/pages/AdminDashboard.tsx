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
import { TrendingUp, DollarSign, Clock, Users, ShoppingBag, Timer, X, Edit, Trash, ImagePlus, Check, Save, Calendar, Filter, BarChart3, PieChart as PieChartIcon, Send, MessageSquare, Megaphone, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  // Backend URL configured from environment
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all');
  const [activeTab, setActiveTab] = useState("orders"); // State to track active tab
  
  // Analytics date filtering state
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months' | '6months' | '1year' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'all' | 'recent'>('recent');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

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

  // Broadcast functionality
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to broadcast.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          type: broadcastType
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Broadcast Sent",
          description: `Message sent to ${result.sentCount} whitelisted customers (${result.totalCustomers} total customers in database).`
        });
        setBroadcastMessage('');
        fetchBroadcastHistory();
      } else {
        throw new Error('Failed to send broadcast');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send broadcast message.",
        variant: "destructive"
      });
      console.error("Failed to send broadcast:", error);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const fetchBroadcastHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/broadcast-history`);
      if (response.ok) {
        const history = await response.json();
        setBroadcastHistory(history);
      }
    } catch (error) {
      console.error("Failed to fetch broadcast history:", error);
    }
  };

  // Fetch broadcast history on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBroadcastHistory();
    }
  }, [isAuthenticated]);

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

  // --- Enhanced Analytics Calculations ---
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  
  // Get date range for filtering
  const getDateRange = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    
    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of today
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Start of day
    
    switch (dateRange) {
      case '7days':
        start.setDate(end.getDate() - 6);
        break;
      case '30days':
        start.setDate(end.getDate() - 29);
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  };
  
  const { start: rangeStart, end: rangeEnd } = getDateRange();
  
  const analyticsOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= rangeStart && orderDate <= rangeEnd;
  });
  
  const ordersToday = orders.filter(order => order.createdAt.toISOString().slice(0, 10) === today);
  const todayOrdersCount = ordersToday.length;
  const todayRevenue = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = analyticsOrders.length;
  const totalRevenue = analyticsOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
  
  // Previous period comparison
  const periodDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = new Date(rangeStart);
  prevStart.setDate(rangeStart.getDate() - periodDays);
  const prevEnd = new Date(rangeStart);
  const prevOrders = orders.filter(order => 
    order.createdAt >= prevStart && order.createdAt < prevEnd
  );
  const prevRevenue = prevOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : '0';

  // Top Dishes (by count in analytics orders)
  const dishOrderCounts: Record<string, { name: string, count: number, revenue: number }> = {};
  analyticsOrders.forEach(order => {
    order.items.forEach(item => {
      const name = item.menuItem.name;
      if (!dishOrderCounts[name]) dishOrderCounts[name] = { name, count: 0, revenue: 0 };
      dishOrderCounts[name].count += item.quantity;
      dishOrderCounts[name].revenue += item.menuItem.price * item.quantity;
    });
  });
  const topDishes = Object.values(dishOrderCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const mostOrderedItem = topDishes[0]?.name || 'N/A';

  // Dynamic period data based on selected range
  const getPeriodData = () => {
    const data = [];
    
    if (dateRange === 'custom') {
      // For custom range, determine the best interval based on the range
      const daysDiff = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        // Show daily for up to 7 days
        for (let i = 0; i < daysDiff; i++) {
          const date = new Date(rangeStart);
          date.setDate(rangeStart.getDate() + i);
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          
          const dayOrders = analyticsOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= date && orderDate < nextDate;
          });
          
          data.push({
            period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            date: date.toISOString().slice(0, 10),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          });
        }
      } else if (daysDiff <= 31) {
        // Show daily for up to 31 days
        for (let i = 0; i < daysDiff; i++) {
          const date = new Date(rangeStart);
          date.setDate(rangeStart.getDate() + i);
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          
          const dayOrders = analyticsOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= date && orderDate < nextDate;
          });
          
          data.push({
            period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            date: date.toISOString().slice(0, 10),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          });
        }
      } else {
        // Show monthly for longer periods
        const monthsDiff = Math.ceil(daysDiff / 30);
        for (let i = 0; i < monthsDiff; i++) {
          const monthStart = new Date(rangeStart);
          monthStart.setMonth(rangeStart.getMonth() + i);
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthStart.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);
          
          const monthOrders = analyticsOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthStart && orderDate <= monthEnd;
          });
          
          data.push({
            period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            date: monthStart.toISOString().slice(0, 10),
            orders: monthOrders.length,
            revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          });
        }
      }
    } else if (dateRange === '7days') {
      // For 7 days, show each day individually
      for (let i = 0; i < 7; i++) {
        const date = new Date(rangeStart);
        date.setDate(rangeStart.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const dayOrders = analyticsOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextDate;
        });
        
        data.push({
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString().slice(0, 10),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        });
      }
    } else if (dateRange === '30days') {
      // For 30 days, show each day
      for (let i = 0; i < 30; i++) {
        const date = new Date(rangeStart);
        date.setDate(rangeStart.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const dayOrders = analyticsOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextDate;
        });
        
        data.push({
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString().slice(0, 10),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        });
      }
    } else if (dateRange === '3months') {
      // For 3 months, show each month
      const months = 3;
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(rangeStart);
        monthStart.setMonth(rangeStart.getMonth() + i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthOrders = analyticsOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        data.push({
          period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: monthStart.toISOString().slice(0, 10),
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        });
      }
    } else if (dateRange === '6months') {
      // For 6 months, show each month
      const months = 6;
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(rangeStart);
        monthStart.setMonth(rangeStart.getMonth() + i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthOrders = analyticsOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        data.push({
          period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: monthStart.toISOString().slice(0, 10),
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        });
      }
    } else if (dateRange === '1year') {
      // For 1 year, show each month
      const months = 12;
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(rangeStart);
        monthStart.setMonth(rangeStart.getMonth() + i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthOrders = analyticsOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        data.push({
          period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: monthStart.toISOString().slice(0, 10),
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        });
      }
    }
    
    return data;
  };
  
  const periodData = getPeriodData();

  // Orders by Status (using analytics orders)
  const statusList = ['queued', 'preparing', 'ready', 'picked'];
  const ordersByStatus = statusList.map(status => ({
    status,
    count: analyticsOrders.filter(order => order.status === status).length
  })).filter(item => item.count > 0);

  // Average Preparation Time (for orders with timeRequired)
  const prepTimes = orders.filter(o => o.timeRequired).map(o => o.timeRequired!);
  const avgPrepTime = prepTimes.length > 0 ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0;
  
  // Current order counts for live status (not filtered by date)
  const currentOrderCounts = {
    queued: orders.filter(order => order.status === 'queued').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    ready: orders.filter(order => order.status === 'ready').length,
    picked: orders.filter(order => order.status === 'picked').length,
  };

  // Chart colors - updated for new status colors
  const COLORS = ['hsl(var(--status-queued))', 'hsl(var(--status-preparing))', 'hsl(var(--status-ready))', 'hsl(var(--status-picked))'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAdmin onLogout={handleLogout} />
      
      <main className="container py-4 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Restaurant Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage orders and view analytics for your restaurant
          </p>
        </div>
      

        <Tabs
          defaultValue="orders"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger 
              value="orders" 
              className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 h-auto min-h-[3rem] sm:min-h-[2.5rem] flex items-center justify-center"
            >
              <div className="mobile-tab-text">
                <div className="block sm:inline">Order</div>
                <div className="block sm:inline sm:ml-1">Management</div>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="dishes" 
              className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 h-auto min-h-[3rem] sm:min-h-[2.5rem] flex items-center justify-center"
            >
              <div className="mobile-tab-text">
                <div className="block sm:inline">Dish</div>
                <div className="block sm:inline sm:ml-1">Management</div>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 h-auto min-h-[3rem] sm:min-h-[2.5rem] flex items-center justify-center"
            >
              <div className="mobile-tab-text">Analytics</div>
            </TabsTrigger>
            <TabsTrigger 
              value="broadcast" 
              className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 h-auto min-h-[3rem] sm:min-h-[2.5rem] flex items-center justify-center"
            >
              <div className="mobile-tab-text">Broadcast</div>
            </TabsTrigger>
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
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">Order Management</h2>
                </div>
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
            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">Analytics Dashboard</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select 
                      value={dateRange} 
                      onChange={(e) => {
                        const value = e.target.value as any;
                        setDateRange(value);
                        setShowCustomDates(value === 'custom');
                        if (value !== 'custom') {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }
                      }}
                      className="px-3 py-1 border rounded-md text-sm bg-background w-full sm:w-auto"
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="6months">Last 6 Months</option>
                      <option value="1year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showCustomDates && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground sm:inline hidden" />
                        <Label htmlFor="start-date" className="text-sm font-medium">From:</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <Label htmlFor="end-date" className="text-sm font-medium">To:</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full sm:w-auto"
                        />
                      </div>
                      {customStartDate && customEndDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            // Force re-render by updating the date range
                            setDateRange('custom');
                          }}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                      <span className="text-xs text-muted-foreground">Quick select:</span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            const today = new Date();
                            const lastWeek = new Date();
                            lastWeek.setDate(today.getDate() - 7);
                            setCustomStartDate(lastWeek.toISOString().slice(0, 10));
                            setCustomEndDate(today.toISOString().slice(0, 10));
                          }}
                        >
                          Last Week
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            const today = new Date();
                            const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            setCustomStartDate(firstOfMonth.toISOString().slice(0, 10));
                            setCustomEndDate(today.toISOString().slice(0, 10));
                          }}
                        >
                          This Month
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            const today = new Date();
                            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                            setCustomStartDate(lastMonth.toISOString().slice(0, 10));
                            setCustomEndDate(lastMonthEnd.toISOString().slice(0, 10));
                          }}
                        >
                          Last Month
                        </Button>
                      </div>
                    </div>
                    {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                      <p className="text-sm text-destructive mt-2">Start date must be before end date</p>
                    )}
                  </div>
                )}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="break-words">Date Range: {rangeStart.toLocaleDateString()} - {rangeEnd.toLocaleDateString()}</p>
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                    <p>Total Orders in Period: {analyticsOrders.length}</p>
                    <p>All Orders: {orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                    <span className="text-xs sm:text-sm font-medium">Total Revenue</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-success">₹{totalRevenue.toFixed(0)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-3 h-3 text-success mr-1" />
                    <span className="text-xs text-success">+{revenueGrowth}% from previous period</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">Total Orders</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{totalOrders}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Avg: ₹{averageOrderValue} per order
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                    <span className="text-xs sm:text-sm font-medium">Today's Orders</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-warning">{todayOrdersCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Revenue: ₹{todayRevenue.toFixed(0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                    <span className="text-xs sm:text-sm font-medium">Avg Prep Time</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-info">{avgPrepTime}m</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Order to ready
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Enhanced Revenue Chart */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <CardTitle className="text-lg">Revenue Trends</CardTitle>
                    <Badge variant="outline" className="w-fit">{dateRange.replace('days', ' Days').replace('months', ' Months').replace('year', ' Year')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <BarChart data={periodData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        fontSize={10}
                        angle={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? -45 : 0}
                        textAnchor={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? 'end' : 'middle'}
                        height={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? 60 : 30}
                        interval={periodData.length > 10 ? 1 : 0}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Enhanced Orders Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <LineChart data={periodData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        fontSize={10}
                        angle={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? -45 : 0}
                        textAnchor={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? 'end' : 'middle'}
                        height={dateRange === '30days' || (dateRange === 'custom' && periodData.length > 7) ? 60 : 30}
                        interval={periodData.length > 10 ? 1 : 0}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Orders']}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Top Dishes */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <CardTitle className="text-lg">Top Dishes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {topDishes.map((dish, index) => (
                      <div key={dish.name} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{dish.name}</p>
                            <p className="text-xs text-muted-foreground">₹{dish.revenue.toFixed(0)} revenue</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{dish.count} sold</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Orders by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        className="sm:outerRadius-[70px]"
                        dataKey="count"
                        nameKey="status"
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Orders']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-4">
                    {ordersByStatus.map((entry, index) => (
                      <div key={entry.status} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs sm:text-sm capitalize truncate">{entry.status}: {entry.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Performance Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm font-medium">Most Popular Item</span>
                    <span className="text-xs sm:text-sm font-bold text-primary truncate">{mostOrderedItem}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm font-medium">Average Order Value</span>
                    <span className="text-xs sm:text-sm font-bold text-success">₹{averageOrderValue}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm font-medium">Revenue Growth</span>
                    <span className="text-xs sm:text-sm font-bold text-success">+{revenueGrowth}%</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm font-medium">Orders Today</span>
                    <span className="text-xs sm:text-sm font-bold text-warning">{todayOrdersCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            {/* Broadcast Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">WhatsApp Broadcast</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send promotional messages to your customers via WhatsApp
                </p>
              </CardHeader>
            </Card>

            {/* Broadcast Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Compose Message</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="broadcast-type" className="text-sm font-medium">Audience</Label>
                    <select
                      id="broadcast-type"
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as 'all' | 'recent')}
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="recent">Recent Customers (Last 30 days)</option>
                      <option value="all">All Customers</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="broadcast-message" className="text-sm font-medium">Message</Label>
                    <textarea
                      id="broadcast-message"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Enter your promotional message here..."
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background min-h-[120px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {broadcastMessage.length}/1000 characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Message Templates</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => setBroadcastMessage("🎉 Special Offer! Get 20% off on all orders today. Use code: SAVE20. Order now via WhatsApp!")}
                      >
                        <div>
                          <div className="font-medium text-xs">Special Offer</div>
                          <div className="text-xs text-muted-foreground">20% discount promotion</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => setBroadcastMessage("🍕 New Menu Alert! Try our delicious new dishes. Fresh ingredients, amazing taste. Order now!")}
                      >
                        <div>
                          <div className="font-medium text-xs">New Menu</div>
                          <div className="text-xs text-muted-foreground">New dishes announcement</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => setBroadcastMessage("🎊 Happy Holidays! Celebrate with our festive special menu. Limited time offer. Order today!")}
                      >
                        <div>
                          <div className="font-medium text-xs">Festive Special</div>
                          <div className="text-xs text-muted-foreground">Holiday promotion</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast || !broadcastMessage.trim()}
                    className="w-full"
                  >
                    {isSendingBroadcast ? (
                      <>
                        <Timer className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Broadcast
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Broadcast History */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Broadcast History</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {broadcastHistory.length > 0 ? (
                      broadcastHistory.slice(0, 5).map((broadcast, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(broadcast.sentAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {broadcast.sentCount} sent
                            </Badge>
                          </div>
                          <p className="text-sm line-clamp-2">{broadcast.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Broadcast Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Broadcast Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2 text-success">✅ Best Practices</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Keep messages concise and clear</li>
                      <li>• Include clear call-to-action</li>
                      <li>• Use emojis to make messages engaging</li>
                      <li>• Send during business hours</li>
                      <li>• Personalize when possible</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-destructive">❌ Avoid</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Sending too frequently</li>
                      <li>• Using all caps</li>
                      <li>• Misleading offers</li>
                      <li>• Sending late at night</li>
                      <li>• Generic mass messages</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <CardTitle>WhatsApp Broadcast</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send promotional messages to your customers
                </p>
                <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
                  <p className="text-xs text-warning-foreground">
                    ⚠️ Currently only sending to whitelisted numbers for testing
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="broadcast-message">Message</Label>
                    <textarea
                      id="broadcast-message"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Enter your promotional message..."
                      className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                    />
                  </div>
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast || !broadcastMessage.trim()}
                  >
                    {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}