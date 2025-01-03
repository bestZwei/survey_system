import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SurveyList from './pages/SurveyList';
import SurveyCreate from './pages/SurveyCreate';
import SurveyDetail from './pages/SurveyDetail';
import MySurveys from './pages/MySurveys';
import MyResponses from './pages/MyResponses';
import SurveyStats from './pages/SurveyStats';
import Layout from './components/Layout';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/surveys" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="surveys" element={<SurveyList />} />
            <Route path="my-surveys" element={<MySurveys />} />
            <Route path="my-responses" element={<MyResponses />} />
            <Route path="surveys/create" element={<SurveyCreate />} />
            <Route path="surveys/:id" element={<SurveyDetail />} />
            <Route path="surveys/:id/edit" element={<SurveyDetail edit />} />
            <Route path="surveys/:id/stats" element={<SurveyStats />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App; 