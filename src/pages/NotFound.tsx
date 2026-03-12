import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-8xl md:text-9xl font-bold text-primary/20 mb-2">404</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="font-heading text-2xl font-bold">Page not found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button asChild>
              <Link to="/"><Home className="mr-2 h-4 w-4" /> Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/internships"><Search className="mr-2 h-4 w-4" /> Browse Internships</Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFound;
