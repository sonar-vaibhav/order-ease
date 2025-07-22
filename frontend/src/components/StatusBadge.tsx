import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'queued':
        return {
          label: 'Queued',
          className: 'bg-status-queued/10 text-status-queued-foreground border-status-queued/20'
        };
      case 'preparing':
        return {
          label: 'Preparing',
          className: 'bg-status-preparing/10 text-status-preparing-foreground border-status-preparing/20'
        };
      case 'ready':
        return {
          label: 'Ready for Pickup',
          className: 'bg-status-ready/10 text-status-ready-foreground border-status-ready/20'
        };
      case 'picked':
        return {
          label: 'Picked Up',
          className: 'bg-status-picked/10 text-status-picked-foreground border-status-picked/20'
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}