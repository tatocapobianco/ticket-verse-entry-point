
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import BuyerDashboard from "./pages/BuyerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerOnboarding from "./pages/OrganizerOnboarding";
import ScannerAccess from "./pages/ScannerAccess";
import ScannerDashboard from "./pages/ScannerDashboard";
import PurchasePage from "./pages/PurchasePage";
import PurchaseResult from "./pages/PurchaseResult";
import CourtesyClaimPage from "./pages/CourtesyClaimPage";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import MercadoPagoCallback from "./pages/MercadoPagoCallback";
import PublicEventPage from "./pages/PublicEventPage";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";
import RrppRedirectPage from "./pages/RrppRedirectPage";
import ProductoraPublicPage from "./pages/ProductoraPublicPage";
import AdminGate, { AdminAuthShell, AdminEntry } from "./pages/admin/AdminGate";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminMetrics from "./pages/admin/AdminMetrics";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminProductoras from "./pages/admin/AdminProductoras";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSearch from "./pages/admin/AdminSearch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<HomePage />} />
            <Route path="/evento/:id" element={<PublicEventPage />} />
            <Route path="/productora/:slug" element={<ProductoraPublicPage />} />
            <Route path="/login" element={<Index />} />
            <Route path="/cortesia/:courtesyCode" element={<CourtesyClaimPage />} />
            <Route path="/rrpp/:link_code" element={<RrppRedirectPage />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/auth/mercadopago/callback" element={
              <ProtectedRoute><MercadoPagoCallback /></ProtectedRoute>
            } />

            {/* Auth-required */}
            <Route path="/buyer-dashboard" element={
              <ProtectedRoute><BuyerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer-onboarding" element={
              <ProtectedRoute><OrganizerOnboarding /></ProtectedRoute>
            } />
            <Route path="/organizer" element={
              <ProtectedRoute><OrganizerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer-dashboard" element={
              <ProtectedRoute><OrganizerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer/events/:id" element={
              <ProtectedRoute><OrganizerEventDetail /></ProtectedRoute>
            } />
            <Route path="/scanner-access" element={
              <ProtectedRoute><ScannerAccess /></ProtectedRoute>
            } />
            <Route path="/scanner-dashboard" element={
              <ProtectedRoute><ScannerDashboard /></ProtectedRoute>
            } />
            <Route path="/purchase/:eventId/:ticketId" element={
              <ProtectedRoute><PurchasePage /></ProtectedRoute>
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
