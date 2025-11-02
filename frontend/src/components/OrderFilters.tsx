import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus } from "@/types";

interface OrderFiltersProps {
  activeFilter: 'all' | OrderStatus;
  onFilterChange: (filter: 'all' | OrderStatus) => void;
  orderCounts: Record<'all' | OrderStatus, number>;
}

export function OrderFilters({ activeFilter, onFilterChange, orderCounts }: OrderFiltersProps) {
  return (
    <div className="w-full">
      {/* Mobile: Scrollable horizontal tabs */}
      <div className="block sm:hidden">
        <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
          <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide p-1 bg-muted rounded-lg">
            <TabsTrigger 
              value="all" 
              className="flex-shrink-0 text-xs px-3 py-2 whitespace-nowrap"
            >
              All ({orderCounts.all})
            </TabsTrigger>
            <TabsTrigger 
              value="queued" 
              className="flex-shrink-0 text-xs px-3 py-2 whitespace-nowrap"
            >
              Queued ({orderCounts.queued})
            </TabsTrigger>
            <TabsTrigger 
              value="preparing" 
              className="flex-shrink-0 text-xs px-3 py-2 whitespace-nowrap"
            >
              Preparing ({orderCounts.preparing})
            </TabsTrigger>
            <TabsTrigger 
              value="ready" 
              className="flex-shrink-0 text-xs px-3 py-2 whitespace-nowrap"
            >
              Ready ({orderCounts.ready})
            </TabsTrigger>
            <TabsTrigger 
              value="picked" 
              className="flex-shrink-0 text-xs px-3 py-2 whitespace-nowrap"
            >
              Picked ({orderCounts.picked})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden sm:block">
        <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="all" className="text-sm px-4 py-2">
              All ({orderCounts.all})
            </TabsTrigger>
            <TabsTrigger value="queued" className="text-sm px-4 py-2">
              Queued ({orderCounts.queued})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="text-sm px-4 py-2">
              Preparing ({orderCounts.preparing})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-sm px-4 py-2">
              Ready ({orderCounts.ready})
            </TabsTrigger>
            <TabsTrigger value="picked" className="text-sm px-4 py-2">
              Picked ({orderCounts.picked})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}