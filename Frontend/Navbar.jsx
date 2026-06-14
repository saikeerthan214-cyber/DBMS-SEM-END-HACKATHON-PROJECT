import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">
        🔍 SearchPlatform
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/" className="hover:text-blue-200 transition">
          Home
        </Link>

        {token && role === 'ADMIN' && (
          <Link to="/admin" className="hover:text-blue-200 transition">
            Admin Dashboard
          </Link>
        )}

        {!token ? (
          <>
            <Link
              to="/login"
              className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-500 border border-white px-3 py-1 rounded hover:bg-blue-700 transition font-medium"
            >
              Register
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition font-medium"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
