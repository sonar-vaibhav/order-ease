import { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderCardProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: Order['status']) => void;
  showActions?: boolean;
}

export function OrderCard({ order, onStatusUpdate, showActions = false }: OrderCardProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-warning text-warning-foreground';
      case 'preparing':
        return 'bg-primary text-primary-foreground';
      case 'ready':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      default:
        return status;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4" />
            <span>{order.customerPhone}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{order.estimatedTime > 0 ? `${order.estimatedTime}m` : 'Ready'}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Items Ordered:</h4>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{item.menuItem.name}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
              </div>
              <span className="font-medium">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-lg text-primary">${order.totalAmount.toFixed(2)}</span>
        </div>
        
        {/* Admin Actions */}
        {showActions && onStatusUpdate && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Update Status:</span>
              <Select
                value={order.status}
                onValueChange={(value) => onStatusUpdate(order.id, value as Order['status'])}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Order Time */}
        <div className="text-xs text-muted-foreground">
          Ordered: {order.createdAt.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}