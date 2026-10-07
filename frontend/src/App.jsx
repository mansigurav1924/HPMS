import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

import StudentLayout from './layouts/StudentLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import OwnerKYC from './pages/owner/OwnerKYC';
import PropertiesList from './pages/owner/PropertiesList';
import PropertyForm from './pages/owner/PropertyForm';
import RoomsPage from './pages/owner/RoomsPage';
import AdminOwners from './pages/admin/AdminOwners';
import AdminEscalatedComplaints from './pages/admin/AdminEscalatedComplaints';
import SearchPage from './pages/student/SearchPage';
import PropertyDetailPage from './pages/student/PropertyDetailPage';
import WishlistPage from './pages/student/WishlistPage';
import ComparePage from './pages/student/ComparePage';
import StudentComplaintsPage from './pages/student/StudentComplaintsPage';
import OwnerComplaintsPage from './pages/owner/OwnerComplaintsPage';
import ComingSoon from './pages/ComingSoon';

// Generated Pages
import BookingsPage from './pages/student/BookingsPage';
import StayPage from './pages/student/StayPage';
import RentPage from './pages/student/RentPage';
import NoticesPage from './pages/student/NoticesPage';
import NotificationsPage from './pages/student/NotificationsPage';
import ReviewsPage from './pages/student/ReviewsPage';
import ProfilePage from './pages/student/ProfilePage';
import StudentDashboard from './pages/student/StudentDashboard';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerTenants from './pages/owner/OwnerTenants';
import OwnerRent from './pages/owner/OwnerRent';
import OwnerNotices from './pages/owner/OwnerNotices';
import OwnerReviews from './pages/owner/OwnerReviews';
import OwnerReports from './pages/owner/OwnerReports';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProperties from './pages/admin/AdminProperties';
import AdminDuplicates from './pages/admin/AdminDuplicates';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminDataAccess from './pages/admin/AdminDataAccess';
import AdminColleges from './pages/admin/AdminColleges';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/unauthorized" />;
  return children;
}

function MainContent() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full flex flex-col"
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student & Public Routes (StudentLayout) */}
          <Route element={<StudentLayout />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/properties/compare" element={<ComparePage />} />
            
            {/* Student specific protected routes */}
            <Route path="/wishlist" element={<ProtectedRoute role="student"><WishlistPage /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute role="student"><StudentComplaintsPage /></ProtectedRoute>} />
            <Route path="/student/bookings" element={<ProtectedRoute role="student"><BookingsPage /></ProtectedRoute>} />
            <Route path="/student/stay" element={<ProtectedRoute role="student"><StayPage /></ProtectedRoute>} />
            <Route path="/student/rent" element={<ProtectedRoute role="student"><RentPage /></ProtectedRoute>} />
            <Route path="/student/notices" element={<ProtectedRoute role="student"><NoticesPage /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute role="student"><NotificationsPage /></ProtectedRoute>} />
            <Route path="/student/reviews" element={<ProtectedRoute role="student"><ReviewsPage /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute role="student"><ProfilePage /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          </Route>

          {/* Owner Routes (DashboardLayout) */}
          <Route path="/owner" element={<ProtectedRoute role="owner"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<OwnerDashboard />} />
            <Route path="kyc" element={<OwnerKYC />} />
            <Route path="properties" element={<PropertiesList />} />
            <Route path="properties/new" element={<PropertyForm />} />
            <Route path="properties/:id/edit" element={<PropertyForm />} />
            <Route path="properties/:propertyId/rooms" element={<RoomsPage />} />
            <Route path="complaints" element={<OwnerComplaintsPage />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="tenants" element={<OwnerTenants />} />
            <Route path="rent" element={<OwnerRent />} />
            <Route path="notices" element={<OwnerNotices />} />
            <Route path="reviews" element={<OwnerReviews />} />
            <Route path="reports" element={<OwnerReports />} />
          </Route>

          {/* Admin Routes (DashboardLayout) */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="owners" element={<AdminOwners />} />
            <Route path="escalated" element={<AdminEscalatedComplaints />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="duplicates" element={<AdminDuplicates />} />
            <Route path="colleges" element={<AdminColleges />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit" element={<AdminAuditLog />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="data-access" element={<AdminDataAccess />} />
          </Route>

          <Route path="/unauthorized" element={
            <div className="text-center mt-20 text-red-600 text-2xl font-bold">Unauthorized Access</div>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
