import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus } from "@/types";

interface OrderFiltersProps {
  activeFilter: 'all' | OrderStatus;
  onFilterChange: (filter: 'all' | OrderStatus) => void;
  orderCounts: Record<'all' | OrderStatus, number>;
}

export function OrderFilters({ activeFilter, onFilterChange, orderCounts }: OrderFiltersProps) {
  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:grid-cols-5">
        <TabsTrigger value="all" className="text-xs sm:text-sm">
          All ({orderCounts.all})
        </TabsTrigger>
        <TabsTrigger value="queued" className="text-xs sm:text-sm">
          Queued ({orderCounts.queued})
        </TabsTrigger>
        <TabsTrigger value="preparing" className="text-xs sm:text-sm">
          Preparing ({orderCounts.preparing})
        </TabsTrigger>
        <TabsTrigger value="ready" className="text-xs sm:text-sm">
          Ready ({orderCounts.ready})
        </TabsTrigger>
        <TabsTrigger value="picked" className="text-xs sm:text-sm">
          Picked ({orderCounts.picked})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}