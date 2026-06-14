import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = localStorage.getItem('token');
  const role      = localStorage.getItem('role');
  const username  = localStorage.getItem('username');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Search</span>
            <span className="text-neon-blue">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive('/')}>Home</NavLink>
          {token && role !== 'ADMIN' && (
            <NavLink to="/dashboard" active={isActive('/dashboard')}>My Dashboard</NavLink>
          )}
          {token && role === 'ADMIN' && (
            <NavLink to="/admin" active={isActive('/admin')}>Admin</NavLink>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold">
                  {username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-slate-300">{username}</span>
                {role === 'ADMIN' && (
                  <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                    Admin
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1.5 text-sm rounded-full glass border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Get Started
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 glass rounded-lg"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-3"
          >
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white py-2">Home</Link>
            {token && role !== 'ADMIN' && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white py-2">My Dashboard</Link>
            )}
            {token && role === 'ADMIN' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white py-2">Admin</Link>
            )}
            {!token ? (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center py-2 glass rounded-lg text-sm text-slate-300" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="flex-1 text-center py-2 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-lg text-sm text-white font-medium" onClick={() => setMenuOpen(false)}>Register</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="text-left text-red-400 py-2 text-sm">Logout</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to}>
      <motion.span
        whileHover={{ scale: 1.05 }}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer block ${
          active
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {children}
      </motion.span>
    </Link>
  );
}

export default Navbar;
