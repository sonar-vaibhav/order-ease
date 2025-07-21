import { MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {item.preparationTime}m
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2 line-clamp-1">{item.name}</CardTitle>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">${item.price}</span>
          <Badge variant="outline">{item.category}</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={() => onAddToCart(item)}
          disabled={!item.available}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}