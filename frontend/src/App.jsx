import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
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

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/unauthorized" />;
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link to="/search" className="flex items-center gap-2.5 text-xl font-extrabold text-indigo-600 hover:text-indigo-800 transition">
            <img src="/favicon.svg" alt="HPMS Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span>HPMS Portal</span>
          </Link>

          <div className="flex gap-4 text-sm font-medium text-gray-600">
            <Link to="/search" className="hover:text-indigo-600">Find Hostels & PGs</Link>
            {user?.role === 'student' && (
              <>
                <Link to="/wishlist" className="hover:text-indigo-600">My Wishlist</Link>
                <Link to="/complaints" className="hover:text-indigo-600">My Complaints</Link>
              </>
            )}
            {user?.role === 'owner' && (
              <>
                <Link to="/owner/properties" className="hover:text-indigo-600">My Properties</Link>
                <Link to="/owner/kyc" className="hover:text-indigo-600">KYC Status</Link>
                <Link to="/owner/complaints" className="hover:text-indigo-600">Complaints</Link>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/owners" className="hover:text-indigo-600">Verification Queue</Link>
                <Link to="/admin/escalated" className="hover:text-indigo-600">Escalated</Link>
              </>
            )}
          </div>
        </div>
        <div>
          {user ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-700 font-medium">
                Hello, {user.name} <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded capitalize">{user.role}</span>
              </span>
              <button onClick={logout} className="text-sm font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 transition">Login</Link>
              <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 shadow-md transition">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>
      <main className="p-8 flex-1 w-full max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/properties/compare" element={<ComparePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Protected Routes */}
            <Route path="/wishlist" element={<ProtectedRoute role="student"><WishlistPage /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute role="student"><StudentComplaintsPage /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute role="student"><Navigate to="/search" /></ProtectedRoute>} />

            {/* Owner Routes */}
            <Route path="/owner" element={<ProtectedRoute role="owner"><Navigate to="/owner/properties" /></ProtectedRoute>} />
            <Route path="/owner/kyc" element={<ProtectedRoute role="owner"><OwnerKYC /></ProtectedRoute>} />
            <Route path="/owner/properties" element={<ProtectedRoute role="owner"><PropertiesList /></ProtectedRoute>} />
            <Route path="/owner/properties/new" element={<ProtectedRoute role="owner"><PropertyForm /></ProtectedRoute>} />
            <Route path="/owner/properties/:id/edit" element={<ProtectedRoute role="owner"><PropertyForm /></ProtectedRoute>} />
            <Route path="/owner/properties/:propertyId/rooms" element={<ProtectedRoute role="owner"><RoomsPage /></ProtectedRoute>} />
            <Route path="/owner/complaints" element={<ProtectedRoute role="owner"><OwnerComplaintsPage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><Navigate to="/admin/owners" /></ProtectedRoute>} />
            <Route path="/admin/owners" element={<ProtectedRoute role="admin"><AdminOwners /></ProtectedRoute>} />
            <Route path="/admin/escalated" element={<ProtectedRoute role="admin"><AdminEscalatedComplaints /></ProtectedRoute>} />

            <Route path="/unauthorized" element={
              <div className="text-center mt-20 text-red-600 text-2xl font-bold">Unauthorized Access</div>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
