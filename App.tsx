
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import ProjectDetails from './pages/ProjectDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import ExpenseDetails from './pages/ExpenseDetails';
import SetupProfile from './pages/SetupProfile';
import CalendarPage from './pages/Calendar';
import OnboardingGuard from './components/OnboardingGuard';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          {/* Public / Setup Route */}
          <Route path="/setup-profile" element={<SetupProfile />} />

          {/* Protected Routes - Require Onboarding Check */}
          <Route path="/" element={
            <OnboardingGuard>
              <Layout />
            </OnboardingGuard>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="add" element={<ProjectForm />} />
            <Route path="project/:id" element={<ProjectDetails />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/:id" element={<ExpenseDetails />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;
