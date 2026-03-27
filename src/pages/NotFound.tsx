import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="hero-surface max-w-2xl text-center">
        <p className="section-kicker">Route Not Found</p>
        <h1 className="page-header">404</h1>
        <p className="page-description mt-4">
          The page you requested does not exist or may have been moved during the Academic Sphere Hub redesign.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Go To Landing Page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/home">Open App Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
