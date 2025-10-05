import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext"; 
import LoadingScreen from "./components/LoadingScreen";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import WGPage from "./pages/WGPage";
import ProfilePage from "./pages/ProfilePage";
import WGUpdate from "./pages/WGUpdate";
import { useEffect, useState } from "react";
import TaskListPage from "./pages/TaskListPage";
import TaskListDetailPage from "./pages/TaskListDetailPage";
import UndoneTasksPage from "./pages/UndoneTasksPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import ShoppingListDetailPage from "./pages/ShoppingListDetailPage";
import BudgetPlansPage from "./pages/BudgetPlansPage";
import BudgetPlanDetailPage from "./pages/BudgetPlanDetailPage";
import Navbar from "./components/Navbar";

// A new Layout component to wrap pages that should have the theme toggle and the navbar
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 seconds for splash screen

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  if (showSplash) {
    return <LoadingScreen />;
  }

  return (
    <AlertProvider>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/splash" element={<LoadingScreen />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>}/>
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}/>
        <Route path="/wg/:id" element={<ProtectedRoute><WGPage /></ProtectedRoute>}/>
        <Route path="/wg/:id/manage" element={<ProtectedRoute><WGUpdate /></ProtectedRoute>} />
        <Route path="/wg/:id/task_lists" element={<ProtectedRoute>  <TaskListPage /> </ProtectedRoute>} />
        <Route path="/tasklist/:id" element={<ProtectedRoute><TaskListDetailPage /></ProtectedRoute>} />
        <Route path="/wg/:id/undone-tasks" element={<ProtectedRoute><UndoneTasksPage /></ProtectedRoute>} />
        <Route path="/wg/:id/shopping_lists" element={<ProtectedRoute> <ShoppingListPage /> </ProtectedRoute>} />
        <Route path="/shoppinglist/:id" element={<ProtectedRoute><ShoppingListDetailPage /></ProtectedRoute>} />
        <Route path="/wg/:id/budget_plans" element={<ProtectedRoute> <BudgetPlansPage /> </ProtectedRoute>} />
        <Route path="/budgetplan/:id" element={<ProtectedRoute><BudgetPlanDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AlertProvider>
  );
}

export default App;