import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-vibetune-dark">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-vibetune-green rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
          <p className="text-xl text-vibetune-text-muted mb-8">
            The page you're looking for doesn't exist in VibeTune
          </p>
        </div>
        
        <Link to="/">
          <Button className="bg-vibetune-green hover:bg-vibetune-green-dark text-black font-semibold">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <p className="text-sm text-vibetune-text-muted mt-6">
          Continue exploring your music with VibeTune
        </p>
      </div>
    </div>
  );
};

export default NotFound;
