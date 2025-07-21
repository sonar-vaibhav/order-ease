import { MenuItem, Order, OrderAnalytics } from "@/types";

export const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Margherita Pizza",
    description: "Fresh tomatoes, mozzarella, basil, olive oil",
    price: 12.99,
    category: "Pizza",
    image: "/api/placeholder/300/200",
    available: true,
    preparationTime: 15
  },
  {
    id: "2",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with tender chicken and spices",
    price: 16.99,
    category: "Main Course",
    image: "/api/placeholder/300/200",
    available: true,
    preparationTime: 25
  },
  {
    id: "3",
    name: "Caesar Salad",
    description: "Crisp romaine lettuce, parmesan, croutons, caesar dressing",
    price: 9.99,
    category: "Salads",
    image: "/api/placeholder/300/200",
    available: true,
    preparationTime: 10
  },
  {
    id: "4",
    name: "Grilled Salmon",
    description: "Atlantic salmon with herbs and lemon butter sauce",
    price: 22.99,
    category: "Main Course",
    image: "/api/placeholder/300/200",
    available: true,
    preparationTime: 20
  },
  {
    id: "5",
    name: "Chocolate Brownie",
    description: "Rich chocolate brownie with vanilla ice cream",
    price: 7.99,
    category: "Dessert",
    image: "/api/placeholder/300/200",
    available: true,
    preparationTime: 5
  },
  {
    id: "6",
    name: "Pasta Carbonara",
    description: "Creamy pasta with pancetta, eggs, and parmesan",
    price: 14.99,
    category: "Pasta",
    image: "/api/placeholder/300/200",
    available: false,
    preparationTime: 15
  }
];

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      { menuItem: mockMenuItems[0], quantity: 2 },
      { menuItem: mockMenuItems[2], quantity: 1 }
    ],
    customerName: "John Doe",
    customerPhone: "+1234567890",
    totalAmount: 35.97,
    status: "preparing",
    estimatedTime: 15,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 15 * 60 * 1000)  // 15 minutes ago
  },
  {
    id: "ORD-002",
    items: [
      { menuItem: mockMenuItems[1], quantity: 1 },
      { menuItem: mockMenuItems[4], quantity: 2 }
    ],
    customerName: "Jane Smith",
    customerPhone: "+1234567891",
    totalAmount: 32.97,
    status: "queued",
    estimatedTime: 25,
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000)  // 10 minutes ago
  },
  {
    id: "ORD-003",
    items: [
      { menuItem: mockMenuItems[3], quantity: 1 }
    ],
    customerName: "Mike Johnson",
    customerPhone: "+1234567892",
    totalAmount: 22.99,
    status: "ready",
    estimatedTime: 0,
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)   // 5 minutes ago
  }
];

export const mockAnalytics: OrderAnalytics = {
  totalOrders: 156,
  todayOrders: 23,
  totalRevenue: 2847.50,
  mostOrderedItem: "Margherita Pizza",
  averageOrderValue: 18.25,
  ordersByDay: [
    { date: "2024-01-15", orders: 12, revenue: 245.80 },
    { date: "2024-01-16", orders: 18, revenue: 387.50 },
    { date: "2024-01-17", orders: 15, revenue: 298.20 },
    { date: "2024-01-18", orders: 22, revenue: 456.30 },
    { date: "2024-01-19", orders: 19, revenue: 342.90 },
    { date: "2024-01-20", orders: 25, revenue: 521.40 },
    { date: "2024-01-21", orders: 23, revenue: 498.70 }
  ],
  ordersByStatus: [
    { status: "queued", count: 8 },
    { status: "preparing", count: 12 },
    { status: "ready", count: 3 }
  ]
};