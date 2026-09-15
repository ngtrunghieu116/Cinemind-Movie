import { Navigate } from 'react-router-dom';

const MyBookings = () => {
  return <Navigate to="/profile?tab=bookings" replace />;
};

export default MyBookings;
