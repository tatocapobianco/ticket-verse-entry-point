
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import WelcomePage from "./pages/WelcomePage";
import BuyerDashboard from "./pages/BuyerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerOnboarding from "./pages/OrganizerOnboarding";
import ScannerAccess from "./pages/ScannerAccess";
import ScannerDashboard from "./pages/ScannerDashboard";
import PurchasePage from "./pages/PurchasePage";
import PurchaseResult from "./pages/PurchaseResult";
import CourtesyClaimPage from "./pages/CourtesyClaimPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import MercadoPagoCallback from "./pages/MercadoPagoCallback";
import PublicEventsPage from "./pages/PublicEventsPage";
import PublicEventPage from "./pages/PublicEventPage";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/eventos" element={<PublicEventsPage />} />
            <Route path="/evento/:id" element={<PublicEventPage />} />
            <Route path="/cortesia/:courtesyCode" element={<CourtesyClaimPage />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/auth/mercadopago/callback" element={
              <ProtectedRoute><MercadoPagoCallback /></ProtectedRoute>
            } />



            {/* Auth-required */}
            <Route path="/verify-email" element={
              <ProtectedRoute><VerifyEmailPage /></ProtectedRoute>
            } />
            <Route path="/welcome" element={
              <ProtectedRoute><WelcomePage /></ProtectedRoute>
            } />
            <Route path="/buyer-dashboard" element={
              <ProtectedRoute><BuyerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer-onboarding" element={
              <ProtectedRoute><OrganizerOnboarding /></ProtectedRoute>
            } />
            <Route path="/organizer-dashboard" element={
              <ProtectedRoute requireRole="organizer"><OrganizerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer/events/:id" element={
              <ProtectedRoute requireRole="organizer"><OrganizerEventDetail /></ProtectedRoute>
            } />
            <Route path="/scanner-access" element={
              <ProtectedRoute><ScannerAccess /></ProtectedRoute>
            } />
            <Route path="/scanner-dashboard" element={
              <ProtectedRoute><ScannerDashboard /></ProtectedRoute>
            } />
            <Route path="/purchase/:eventId/:ticketId" element={
              <ProtectedRoute requireVerifiedEmail><PurchasePage /></ProtectedRoute>
            } />
            <Route path="/purchase-result" element={
              <ProtectedRoute><PurchaseResult /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
