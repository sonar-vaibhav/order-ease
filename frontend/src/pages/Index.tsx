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
      <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Welcome to OrderEase
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Delicious Food,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Delivered Fresh
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the perfect blend of traditional flavors and modern convenience. 
            Order online and pick up your favorite dishes in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu">
              <Button size="lg" className="text-lg px-8">
                Browse Menu
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Track Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose OrderEase?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing an exceptional dining experience with every order.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Browse our menu and place your order now. Fresh, delicious food is just a few clicks away!
          </p>
          <Link to="/menu">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Order Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">OE</span>
            </div>
            <span className="font-bold text-xl">OrderEase</span>
          </div>
          <p className="text-muted-foreground">
            Making great food accessible to everyone, one order at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
