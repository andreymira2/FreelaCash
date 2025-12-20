import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import ProjectDetails from './pages/ProjectDetails';
import ClientDetails from './pages/ClientDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import ExpenseDetails from './pages/ExpenseDetails';
import SetupProfile from './pages/SetupProfile';
import CalendarPage from './pages/Calendar';
import OnboardingGuard from './components/OnboardingGuard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Setup Profile Route */}
            <Route path="/setup-profile" element={
              <PrivateRoute>
                <SetupProfile />
              </PrivateRoute>
            } />

            {/* Protected Routes - Require Auth + Onboarding Check */}
            <Route path="/" element={
              <PrivateRoute>
                <OnboardingGuard>
                  <Layout />
                </OnboardingGuard>
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="add" element={<ProjectForm />} />
              <Route path="project/:id" element={<ProjectDetails />} />
              <Route path="client/:id" element={<ClientDetails />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/:id" element={<ExpenseDetails />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="calendar" element={<CalendarPage />} />
            </Route>

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
