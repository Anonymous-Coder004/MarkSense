import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { AdminDashboard } from './pages/admin/Dashboard';
import { EmployeeAttendance } from './pages/employee/Attendance';
import { EmployeeLeaves } from './pages/employee/Leaves';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminLeaves } from './pages/admin/Leaves';
import { AdminSettings } from './pages/admin/Settings';
import { AdminReports } from './pages/admin/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/employee" element={
              <ProtectedRoute role="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/employee/attendance" element={
              <ProtectedRoute role="employee">
                <EmployeeAttendance />
              </ProtectedRoute>
            } />
            
            <Route path="/employee/leaves" element={
              <ProtectedRoute role="employee">
                <EmployeeLeaves />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/employees" element={
              <ProtectedRoute role="admin">
                <AdminEmployees />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leaves" element={
              <ProtectedRoute role="admin">
                <AdminLeaves />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute role="admin">
                <AdminSettings />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute role="admin">
                <AdminReports />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;