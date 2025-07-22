import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MenuCard } from "@/components/MenuCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Remove mockMenuItems import, since we will use real data from backend
// import { mockMenuItems } from "@/data/mockData";
import { MenuItem } from "@/types";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";

export default function Menu() {
  // State to hold menu items fetched from backend
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  // State to show loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '';

  // Fetch dishes from backend API when component mounts
  useEffect(() => {
    // Why: To get real menu items from the database
    setLoading(true);
    fetch("http://localhost:8080/api/dishes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch menu items");
        return res.json();
      })
      .then((data) => {
        // Map backend dish data to MenuItem type and prefix image URLs
        const mapped = data.map((dish: any) => ({
          id: dish._id || dish.id,
          name: dish.name,
          description: dish.description || '',
          price: dish.price,
         
          image: dish.imageUrl ? BACKEND_URL + dish.imageUrl : '',
          available: dish.available,
          preparationTime: dish.preparationTime || 15, // fallback if not present
        }));
        setMenuItems(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // Empty dependency array: runs once on mount

  // Filter menu items based only on search
  const filteredItems = menuItems.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItemsCount={cartItems.length} />
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
          {/* Category Filter UI - remove this section */}
          {/* <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div> */}
        </div>
        {/* Loading and Error States */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Loading menu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id || item._id}
                item={item}
                onAddToCart={(item) => {
                  addToCart(item);
                  toast({
                    title: "Added to cart",
                    description: `${item.name} has been added to your cart.`,
                  });
                }}
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
                // setSelectedCategory("all"); // This line is removed
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