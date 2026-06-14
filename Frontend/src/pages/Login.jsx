import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      const { token, role, username } = res.data;
      localStorage.setItem('token',    token);
      localStorage.setItem('role',     role);
      localStorage.setItem('username', username);
      navigate(role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orbs */}
      <div className="orb w-80 h-80 bg-cyan-500 top-0 left-0" />
      <div className="orb w-64 h-64 bg-violet-600 bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 border border-white/8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xl mx-auto mb-4 shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl px-4 py-3 border border-red-500/20 text-red-400 text-sm mb-5"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username" id="username" name="username" type="text"
              placeholder="Enter your username" value={form.username} onChange={handleChange} />
            <Field label="Password" id="password" name="password" type="password"
              placeholder="Enter your password" value={form.password} onChange={handleChange} />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, id, name, type, placeholder, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id} name={name} type={type} required
        value={value} onChange={onChange} placeholder={placeholder}
        className="w-full glass rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm border border-white/8 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
      />
    </div>
  );
}

export default Login;
