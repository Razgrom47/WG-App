import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import WGPage from "./pages/WGPage";
import ProfilePage from "./pages/ProfilePage";
import { useEffect, useState } from "react";

// A new Layout component to wrap pages that should have the theme toggle
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3-second delay
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wg/:id"
        element={
          <ProtectedRoute>
            <WGPage />
          </ProtectedRoute>
        }
      />
      {/* New Protected Routes for WG Management Sections */}
      <Route path="/wg/:id/manage" element={<ProtectedRoute> {/* Add a new ManageWGPage */} </ProtectedRoute>} />
      <Route path="/wg/:id/budget" element={<ProtectedRoute> {/* Add a new BudgetPage */} </ProtectedRoute>} />
      <Route path="/wg/:id/tasks" element={<ProtectedRoute> {/* Add a new TaskPage */} </ProtectedRoute>} />
      <Route path="/wg/:id/shopping" element={<ProtectedRoute> {/* Add a new ShoppingPage */} </ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;