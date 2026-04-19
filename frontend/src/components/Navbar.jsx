import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            RouteReserve
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <span className="text-sm">Welcome, {user.firstName}</span>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-blue-200">
                  Admin Panel
                </Link>
              )}
              <Link to="/bookings" className="hover:text-blue-200">
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-blue-200">
                Login
              </Link>
              <Link to="/register" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
