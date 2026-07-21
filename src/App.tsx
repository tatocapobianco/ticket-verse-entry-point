
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WelcomePage from "./pages/WelcomePage";
import BuyerDashboard from "./pages/BuyerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ScannerAccess from "./pages/ScannerAccess";
import ScannerDashboard from "./pages/ScannerDashboard";
import PurchasePage from "./pages/PurchasePage";
import CourtesyClaimPage from "./pages/CourtesyClaimPage";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/scanner-access" element={<ScannerAccess />} />
          <Route path="/scanner-dashboard" element={<ScannerDashboard />} />
          <Route path="/purchase/:eventId/:ticketId" element={<PurchasePage />} />
          <Route path="/cortesia/:courtesyCode" element={<CourtesyClaimPage />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
