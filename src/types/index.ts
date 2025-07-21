export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  preparationTime: number; // in minutes
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: Array<{
    menuItem: MenuItem;
    quantity: number;
  }>;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'queued' | 'preparing' | 'ready';
  estimatedTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAnalytics {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  mostOrderedItem: string;
  averageOrderValue: number;
  ordersByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}