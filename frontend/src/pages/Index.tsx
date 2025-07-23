import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/ui/navbar";
import { ChefHat, Clock, Star, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const Index = () => {
  const { toast } = useToast();
  const features = [
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: "Fresh Ingredients",
      description: "We use only the finest, locally-sourced ingredients in all our dishes."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Quick Service",
      description: "Fast preparation times without compromising on quality or taste."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "5-Star Quality",
      description: "Consistently rated as one of the best restaurants in the area."
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Easy Pickup",
      description: "Simple ordering system with real-time order tracking."
    }
  ];

  useEffect(() => {
    toast({
      title: "Admin Login (for testing)",
      description: (
        <div>
          <div><b>Username:</b> admin</div>
          <div><b>Password:</b> admin123</div>
        </div>
      ),
      duration: 10000 // 10 seconds
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20 animate-fade-in-down overflow-hidden">
        {/* Animated SVG background */}
        <svg className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 opacity-30 animate-fade-in" width="800" height="400" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="400" cy="200" rx="320" ry="120" fill="url(#paint0_radial)" />
          <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(400 200) scale(320 120)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4 animate-fade-in">
            Welcome to OrderEase
          </Badge>
          <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">
            Delicious Food,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Delivered Fresh
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            Experience the perfect blend of traditional flavors and modern convenience. 
            Order online and pick up your favorite dishes in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Link to="/menu">
              <Button size="lg" className="text-lg px-8 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                Browse Menu
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg" className="text-lg px-8 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                Track Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 animate-fade-in">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose OrderEase?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing an exceptional dining experience with every order.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 group-hover:rotate-6">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20 animate-fade-in-up">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Browse our menu and place your order now. Fresh, delicious food is just a few clicks away!
          </p>
          <Link to="/menu">
            <Button size="lg" className="text-lg px-10 py-4 bg-white text-primary font-bold shadow-lg hover:scale-110 hover:shadow-2xl transition-transform duration-200">
              Order Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-background/80 border-t border-border py-6 text-center text-muted-foreground text-sm animate-fade-in">
        © {new Date().getFullYear()} OrderEase. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
