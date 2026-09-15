import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppProviders from './providers/AppProviders';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';

import Home from './pages/Home';
import MovieList from './pages/MovieList';
import MovieDetail from './pages/MovieDetail';
import TheaterList from './pages/TheaterList';
import TicketPrices from './pages/TicketPrices';
import About from './pages/About';
import Policy from './pages/Policy';
import FoodPreview from './pages/FoodPreview';
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import PaymentResult from './pages/PaymentResult';
import PaymentStatusDetail from './pages/PaymentStatusDetail';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Forbidden from './pages/Forbidden';
import ServerError from './pages/ServerError';

import ROUTES from './constants/routes';

function App() {
  return (
    <AppProviders>
      <Router>
        <Routes>
          {/* Main Layout Shell */}
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.MOVIES} element={<MovieList />} />
            <Route path={ROUTES.MOVIE_DETAIL} element={<MovieDetail />} />
            <Route path={ROUTES.THEATERS} element={<TheaterList />} />
            <Route path={ROUTES.TICKET_PRICES} element={<TicketPrices />} />
            <Route path="/ticket-price" element={<TicketPrices />} />
            <Route path={ROUTES.ABOUT} element={<About />} />
            <Route path={ROUTES.POLICY} element={<Policy />} />
            <Route path={ROUTES.FOOD_PREVIEW} element={<FoodPreview />} />
            <Route path={ROUTES.ARTICLES} element={<ArticleList />} />
            <Route path={ROUTES.ARTICLE_DETAIL} element={<ArticleDetail />} />
            <Route path={ROUTES.PAYMENT_RESULT} element={<PaymentStatusDetail />} />

            {/* Guest Only Routes */}
            <Route element={<GuestRoute />}>
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.PROFILE} element={<Profile />} />
              <Route path={ROUTES.MY_BOOKINGS} element={<MyBookings />} />
              <Route path={ROUTES.BOOKING} element={<Booking />} />
              <Route path={ROUTES.PAYMENT} element={<Payment />} />
              <Route path={ROUTES.PAYMENT_STATUS} element={<PaymentStatusDetail />} />
            </Route>

            {/* Error Pages */}
            <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
            <Route path={ROUTES.FORBIDDEN} element={<Forbidden />} />
            <Route path={ROUTES.SERVER_ERROR} element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AppProviders>
  );
}

export default App;
