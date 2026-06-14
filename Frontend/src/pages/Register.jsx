import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '../services/api';

// IMPROVEMENT #8: Inline field-level validation
function validate(form) {
  const errors = {};
  if (!form.username.trim()) {
    errors.username = 'Username is required';
  } else if (form.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
}

function Register() {
  const navigate = useNavigate();
  const [form,       setForm]       = useState({ username: '', email: '', password: '', role: 'USER' });
  const [errors,     setErrors]     = useState({});   // field-level errors
  const [serverError,setServerError]= useState('');   // API error
  const [loading,    setLoading]    = useState(false);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    // Clear field error as user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Run validation before calling API
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb w-80 h-80 bg-violet-600 top-0 right-0" />
      <div className="orb w-64 h-64 bg-pink-500 bottom-0 left-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 border border-white/8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xl mx-auto mb-4 shadow-lg shadow-violet-500/20">
              🚀
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
            <p className="text-slate-400 text-sm">Join the search platform</p>
          </div>

          {/* Server-level error */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-xl px-4 py-3 border border-red-500/20 text-red-400 text-sm mb-5"
              >
                ⚠️ {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              label="Username" id="username" name="username" type="text"
              placeholder="Min 3 characters" value={form.username}
              onChange={handleChange} error={errors.username}
            />
            <Field
              label="Email" id="email" name="email" type="email"
              placeholder="Enter your email" value={form.email}
              onChange={handleChange} error={errors.email}
            />
            <Field
              label="Password" id="password" name="password" type="password"
              placeholder="Min 6 characters" value={form.password}
              onChange={handleChange} error={errors.password}
            />

            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['USER', 'ADMIN'].map((r) => (
                  <motion.button
                    key={r}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.role === r
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-600/20 border-cyan-500/40 text-cyan-300'
                        : 'glass border-white/8 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'USER' ? '👤 User' : '⚙️ Admin'}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Field with inline error message
function Field({ label, id, name, type, placeholder, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id} name={name} type={type}
        value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full glass rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm border focus:outline-none focus:ring-1 transition-all ${
          error
            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
            : 'border-white/8 focus:border-cyan-500/40 focus:ring-cyan-500/20'
        }`}
      />
      {/* Inline error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Register;
