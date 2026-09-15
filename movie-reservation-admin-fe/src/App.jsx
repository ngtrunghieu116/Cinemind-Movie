import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GenreManagement from './pages/GenreManagement';
import MovieManagement from './pages/MovieManagement';
import TheaterManagement from './pages/TheaterManagement';
import RoomManagement from './pages/RoomManagement';
import ShowtimeManagement from './pages/ShowtimeManagement';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import BookingManagement from './pages/BookingManagement';
import ArticleManagement from './pages/ArticleManagement';
import ReviewManagement from './pages/ReviewManagement';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="genres" element={<GenreManagement />} />
          <Route path="movies" element={<MovieManagement />} />
          <Route path="theaters" element={<TheaterManagement />} />
          <Route path="showtimes" element={<ShowtimeManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="articles" element={<ArticleManagement />} />
          <Route path="reviews" element={<ReviewManagement />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
