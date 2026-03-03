import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Toaster } from '@/components/ui/sonner';

// Screens
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { AdminDashboard } from '@/screens/AdminDashboard';
import { ClientDashboard } from '@/screens/ClientDashboard';
import { FreelancerDashboard } from '@/screens/FreelancerDashboard';
import { DebugPage } from '@/screens/DebugPage';

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StoreInitializer } from '@/components/StoreInitializer';

function App() {
  const { isAuthenticated, currentUser } = useAuthStore();

  // Redirect based on role when already authenticated
  const getDefaultRoute = () => {
    if (!isAuthenticated || !currentUser) return '/onboarding';
    switch (currentUser.role) {
      case 'admin':
        return '/admin';
      case 'client':
        return '/client';
      case 'freelancer':
        return '/freelancer';
      default:
        return '/onboarding';
    }
  };

  return (
    <BrowserRouter>
      <StoreInitializer />
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <OnboardingScreen />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginScreen />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Client Routes */}
          <Route
            path="/client/*"
            element={
              <ProtectedRoute allowedRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Freelancer Routes */}
          <Route
            path="/freelancer/*"
            element={
              <ProtectedRoute allowedRole="freelancer">
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route
            path="/"
            element={<Navigate to={getDefaultRoute()} replace />}
          />

          {/* Debug Route - Development Only */}
          {import.meta.env.DEV && (
            <Route
              path="/debug"
              element={<DebugPage />}
            />
          )}

          {/* Catch All */}
          <Route
            path="*"
            element={<Navigate to={getDefaultRoute()} replace />}
          />
        </Routes>

        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
