import { useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MenuCard } from "@/components/MenuCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockMenuItems } from "@/data/mockData";
import { MenuItem } from "@/types";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Menu() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartCount, setCartCount] = useState(0);
  const { toast } = useToast();

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(mockMenuItems.map(item => item.category)))];

  // Filter menu items
  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item: MenuItem) => {
    setCartCount(prev => prev + 1);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItemsCount={cartCount} />
      
      <main className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Our Menu</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our delicious selection of freshly prepared dishes, made with the finest ingredients.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No items found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}