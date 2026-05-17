import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/stores/auth';
import { LandingPage } from '@/pages/LandingPage';
import { PricingPage } from '@/pages/PricingPage';
import { ChangelogPage } from '@/pages/ChangelogPage';
import { SoonPage } from '@/pages/SoonPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AppPage } from '@/pages/AppPage';
import { AgentDetailPage } from '@/pages/AgentDetailPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const jwt = useAuth((s) => s.jwt);
  if (!jwt) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/soon" element={<SoonPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppPage />
          </RequireAuth>
        }
      />
      <Route
        path="/agent/:agentId"
        element={
          <RequireAuth>
            <AgentDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
