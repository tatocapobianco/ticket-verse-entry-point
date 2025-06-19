
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BuyerDashboard from "./pages/BuyerDashboard";
import ScannerDashboard from "./pages/ScannerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import PurchasePage from "./pages/PurchasePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/scanner-dashboard" element={<ScannerDashboard />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/purchase/:eventId/:ticketId" element={<PurchasePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
