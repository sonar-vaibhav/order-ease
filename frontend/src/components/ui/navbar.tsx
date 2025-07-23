import { ShoppingCart, Clock, LogOut, User, Utensils } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  cartItemsCount?: number;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export function Navbar({ cartItemsCount = 0, isAdmin = false, onLogout }: NavbarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg shadow-lg supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">OrderEase</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {!isAdmin ? (
            <>
              <Link 
                to="/menu" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/menu') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Menu
              </Link>
              <Link 
                to="/track" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/track') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Track Order
              </Link>
            </>
          ) : (
            <Link 
              to="/admin/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/admin/dashboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {!isAdmin ? (
            <Link to="/cart">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Admin</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}