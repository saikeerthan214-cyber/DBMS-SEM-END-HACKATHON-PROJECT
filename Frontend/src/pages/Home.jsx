import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import ResultCard from '../components/ResultCard';
import { getAllItems, searchItems, getAllCategories, logSearch } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  { icon: '📱', text: 'Smartphones under ₹25,000' },
  { icon: '💻', text: 'Gaming Laptops' },
  { icon: '🪑', text: 'Ergonomic Office Chairs' },
  { icon: '🎧', text: 'Noise Cancelling Headphones' },
  { icon: '⌚', text: "Men's Watches" },
  { icon: '📚', text: 'Data Structures Books' },
];

const TRENDING_CHIPS = [
  'Samsung', 'Laptop', 'Headphones', 'Office Chair',
  'Shirt', 'Watch', 'Smartphone', 'Study Table',
];

const CATEGORIES = [
  {
    name: 'Electronics', icon: '💻', count: '60+', desc: 'Phones, laptops, gadgets & accessories',
    color: 'from-cyan-500/15 to-blue-600/15', border: 'border-cyan-500/20',
    glow: 'hover:shadow-cyan-500/25', badge: 'text-cyan-400', dot: 'bg-cyan-400',
  },
  {
    name: 'Clothing', icon: '👕', count: '50+', desc: 'Fashion, shoes, watches & accessories',
    color: 'from-pink-500/15 to-rose-600/15', border: 'border-pink-500/20',
    glow: 'hover:shadow-pink-500/25', badge: 'text-pink-400', dot: 'bg-pink-400',
  },
  {
    name: 'Furniture', icon: '🪑', count: '30+', desc: 'Home décor, office & kitchen items',
    color: 'from-amber-500/15 to-orange-600/15', border: 'border-amber-500/20',
    glow: 'hover:shadow-amber-500/25', badge: 'text-amber-400', dot: 'bg-amber-400',
  },
  {
    name: 'Books', icon: '📚', count: '10+', desc: 'Academic, competitive & fiction',
    color: 'from-violet-500/15 to-purple-600/15', border: 'border-violet-500/20',
    glow: 'hover:shadow-violet-500/25', badge: 'text-violet-400', dot: 'bg-violet-400',
  },
];

const FEATURED = [
  { title: 'iPhone 15 Pro Max 256GB',   price: '₹1,34,900', cat: 'Electronics', badge: '🔥 Hot',     rating: 4.9, img: '📱', location: 'Pan India', verified: true },
  { title: 'MacBook Air M2 8GB/256GB',  price: '₹1,14,900', cat: 'Electronics', badge: '✅ Verified', rating: 4.8, img: '💻', location: 'Pan India', verified: true },
  { title: 'Sony WH-1000XM5',           price: '₹29,990',   cat: 'Electronics', badge: '🏷️ Deal',    rating: 4.7, img: '🎧', location: 'Pan India', verified: true },
  { title: 'Ergonomic Office Chair Pro',price: '₹18,999',   cat: 'Furniture',   badge: '✅ Verified', rating: 4.6, img: '🪑', location: 'Bengaluru', verified: true },
  { title: 'Slim Fit Oxford Shirt',     price: '₹1,299',    cat: 'Clothing',    badge: '🆕 New',      rating: 4.5, img: '👔', location: 'Mumbai',   verified: false },
  { title: 'Samsung Galaxy S24 Ultra',  price: '₹1,29,999', cat: 'Electronics', badge: '🆕 New',      rating: 4.8, img: '📱', location: 'Pan India', verified: true },
];

const WHY_CARDS = [
  { icon: '⚡', title: 'Universal Search',       desc: 'Search across products, services, jobs, and properties — all from one intelligent platform.',     color: 'from-cyan-500/10 to-blue-500/10',    border: 'border-cyan-500/20' },
  { icon: '🤖', title: 'AI Recommendations',     desc: 'Get personalized results powered by intelligent matching and your search history.',               color: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20' },
  { icon: '📍', title: 'Location Aware',          desc: 'Discover the best opportunities and listings near your location automatically.',                   color: 'from-pink-500/10 to-rose-500/10',     border: 'border-pink-500/20' },
  { icon: '✅', title: 'Verified Listings',       desc: 'Browse only trusted businesses and quality results — every listing is checked for authenticity.',  color: 'from-amber-500/10 to-orange-500/10',  border: 'border-amber-500/20' },
];

const TESTIMONIALS = [
  { name: 'Arjun Sharma',   role: 'Software Engineer',   avatar: '👨‍💻', rating: 5, review: 'Found my dream laptop in under 2 minutes. The search filters are incredibly precise and the results are always relevant.' },
  { name: 'Priya Nair',     role: 'Interior Designer',   avatar: '👩‍🎨', rating: 5, review: 'Best platform for furniture discovery. I compare multiple options side by side and the verified badge gives me confidence.' },
  { name: 'Rohan Mehta',    role: 'College Student',     avatar: '👨‍🎓', rating: 5, review: 'Found all my textbooks and study accessories here at great prices. The category filters make it super easy to browse.' },
];

const POPULAR_NEAR_YOU = [
  { name: 'Apple Store',          cat: 'Electronics',  rating: 4.9, reviews: '2.4k', distance: '1.2 km', img: '🍎' },
  { name: 'Home & Decor Studio',  cat: 'Furniture',    rating: 4.7, reviews: '890',  distance: '0.8 km', img: '🛋️' },
  { name: 'Fashion Hub',          cat: 'Clothing',     rating: 4.6, reviews: '1.1k', distance: '2.1 km', img: '👗' },
  { name: 'Book World',           cat: 'Books',        rating: 4.8, reviews: '650',  distance: '1.5 km', img: '📖' },
  { name: 'TechZone',             cat: 'Electronics',  rating: 4.5, reviews: '3.2k', distance: '3.0 km', img: '🔌' },
];

const ease = [0.25, 0.1, 0.25, 1];

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target.replace(/[^0-9]/g, ''));
    const duration = 1800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  const display = target.includes(',') ? count.toLocaleString('en-IN') : count;
  return <span>{display}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded-lg" />
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-4 w-2/3 rounded-lg" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────────
function PremiumSearchBar({ keyword, setKeyword, onSearch, large = false }) {
  const [focused,  setFocused]  = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const inputRef = useRef(null);

  const handleSelect = (val) => {
    const q = val.split(' ')[0];
    setKeyword(q); setShowSugg(false); onSearch(q);
  };

  return (
    <div className="relative w-full">
      <motion.div
        animate={focused
          ? { boxShadow: '0 0 0 2px rgba(0,212,255,0.45), 0 0 60px rgba(0,212,255,0.18), 0 24px 64px rgba(0,0,0,0.45)' }
          : { boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.35)' }}
        transition={{ duration: 0.4 }}
        className="glass-strong rounded-2xl overflow-visible"
      >
        <div className={`flex items-center gap-3 px-5 ${large ? 'py-5' : 'py-4'}`}>
          <motion.svg
            animate={{ color: focused ? '#00d4ff' : '#475569' }}
            transition={{ duration: 0.3 }}
            className={`flex-shrink-0 ${large ? 'w-6 h-6' : 'w-5 h-5'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </motion.svg>

          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setShowSugg(false); onSearch(); } }}
            onFocus={() => { setFocused(true); setShowSugg(true); }}
            onBlur={() => setTimeout(() => { setFocused(false); setShowSugg(false); }, 200)}
            placeholder="Search products, jobs, services, businesses, properties..."
            className={`flex-1 bg-transparent text-white placeholder-slate-500 outline-none min-w-0 ${large ? 'text-lg' : 'text-base'}`}
          />

          {keyword && (
            <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => { setKeyword(''); onSearch(''); }}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}

          {/* Voice */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-all flex-shrink-0"
            title="Voice search"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
            </svg>
          </motion.button>

          <div className="w-px h-6 bg-white/10 flex-shrink-0" />

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { setShowSugg(false); onSearch(); }}
            className={`bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/45 transition-shadow duration-300 flex-shrink-0 flex items-center gap-2 ${large ? 'px-8 py-3 text-base' : 'px-6 py-2.5 text-sm'}`}
          >
            Search
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {showSugg && !keyword && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 glass-strong rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl shadow-black/60"
          >
            <div className="p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-3 py-2 font-medium">Suggested Searches</p>
              {QUICK_SUGGESTIONS.map((s, i) => (
                <motion.button key={s.text}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelect(s.text)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-all group"
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{s.text}</span>
                  <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
function Home() {
  const navigate   = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const [keyword,          setKeyword]          = useState('');
  const [items,            setItems]            = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange,       setPriceRange]       = useState(200000);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [hasSearched,      setHasSearched]      = useState(false);
  const [showAuthPopup,    setShowAuthPopup]    = useState(false);
  const [statsVisible,     setStatsVisible]     = useState(false);
  const statsRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchAllItems = async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllItems();
      const d   = res.data;
      setItems(Array.isArray(d) ? d : d?.content ?? d?.items ?? []);
    } catch { setError('Failed to load items.'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const r = await getAllCategories(); setCategories(r.data); } catch {}
  };

  const runSearch = useCallback(async (q, isInitial = false) => {
    if (!isInitial && !localStorage.getItem('token')) {
      setShowAuthPopup(true); setKeyword(''); return;
    }
    setLoading(true); setError('');
    if (!isInitial) setHasSearched(true);
    try {
      const res = q?.trim() ? await searchItems(q) : await getAllItems();
      const d   = res.data;
      const results = Array.isArray(d) ? d : d?.content ?? d?.items ?? [];
      setItems(results);

      // Record search to Node.js backend (fire-and-forget — don't block UI)
      if (!isInitial && q?.trim()) {
        const username = localStorage.getItem('username') || 'anonymous';
        logSearch(q.trim(), username, results.length).catch(() => {});
      }
    } catch { setError('Search failed. Try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAllItems(); fetchCategories(); }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!keyword) return;
    if (!localStorage.getItem('token')) { setShowAuthPopup(true); setKeyword(''); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(keyword), 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword, runSearch]);

  const handleSearch  = useCallback((val) => { const q = val !== undefined ? val : keyword; clearTimeout(debounceRef.current); runSearch(q); }, [keyword, runSearch]);
  const handleTrending = (t) => { setKeyword(t); clearTimeout(debounceRef.current); runSearch(t); };
  const handleCatClick = (name) => { const c = categories.find(x => x.name === name); if (c) { setSelectedCategory(String(c.id)); setHasSearched(true); } };

  const filteredItems = items.filter(item => {
    const mc = !selectedCategory || item.category?.id === Number(selectedCategory);
    const mp = !item.price || item.price <= priceRange;
    return mc && mp;
  });

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-x-hidden">

      {/* ── AUTH POPUP ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuthPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backdropFilter: 'blur(14px)', background: 'rgba(2,4,8,0.78)' }}
            onClick={() => setShowAuthPopup(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }} transition={{ duration: 0.4, ease }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-3xl p-8 border border-white/10 w-full max-w-sm text-center shadow-2xl">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
                className="text-5xl mb-4">🔐</motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in to Search</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">Create a free account to search and explore all listings.</p>
              <div className="flex flex-col gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/20">
                  Sign In
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="w-full py-3 glass rounded-xl text-white font-medium border border-white/10 hover:border-white/20 transition-all">
                  Create Account
                </motion.button>
                <button onClick={() => setShowAuthPopup(false)}
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors mt-1">
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BG ORBS ───────────────────────────────────────────────────────── */}
      <motion.div className="orb w-[800px] h-[800px] bg-cyan-500 -top-72 -left-64"
        animate={{ x: [0, 50, 0], y: [0, 35, 0] }} transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        style={{ opacity: 0.055 }} />
      <motion.div className="orb w-[650px] h-[650px] bg-violet-600 top-32 -right-52"
        animate={{ x: [0, -35, 0], y: [0, 45, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        style={{ opacity: 0.075 }} />
      <motion.div className="orb w-[450px] h-[450px] bg-pink-500 bottom-80 left-16"
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ opacity: 0.05 }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.018) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      <div className="relative z-10 pt-16">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════════
              HOMEPAGE
          ══════════════════════════════════════════════════════════════════ */}
          {!hasSearched && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5 }}>

              {/* ── HERO ──────────────────────────────────────────────────── */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

                  {/* Left Column */}
                  <div>
                    {/* Badge */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.1, ease }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-7">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      AI-Powered Multi-Category Search Platform
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </motion.div>

                    {/* Headline with glow */}
                    <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.18, ease }} className="relative mb-7">
                      {/* Glow behind headline */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/8 via-violet-600/8 to-pink-500/8 rounded-3xl blur-2xl pointer-events-none" />
                      <h1 className="relative text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02]">
                        <span className="text-white">Discover </span>
                        <span className="gradient-text">Anything</span>
                        <br />
                        <span className="text-white">In </span>
                        <span className="gradient-text">Seconds</span>
                      </h1>
                    </motion.div>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.38, ease }}
                      className="text-slate-400 text-xl max-w-lg leading-relaxed mb-9">
                      Search products, jobs, services, businesses, properties, vehicles and more from{' '}
                      <span className="text-white font-medium">one intelligent platform.</span>
                    </motion.p>

                    {/* Large Search Bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.44, ease }} className="mb-6">
                      <PremiumSearchBar keyword={keyword} setKeyword={setKeyword} onSearch={handleSearch} large={true} />
                    </motion.div>

                    {/* Quick chips */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.58, ease }}
                      className="flex flex-wrap gap-2 items-center mb-2">
                      <span className="text-slate-500 text-xs font-medium">Try:</span>
                      {QUICK_SUGGESTIONS.slice(0, 4).map((s, i) => (
                        <motion.button key={s.text}
                          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.62 + i * 0.07 }}
                          whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleTrending(s.text.split(' ')[0])}
                          className="px-3.5 py-1.5 glass rounded-full text-xs text-slate-400 border border-white/8 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all flex items-center gap-1.5">
                          <span>{s.icon}</span><span>{s.text}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>

                  {/* Right Column — AI Dashboard */}
                  <motion.div initial={{ opacity: 0, x: 44 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.9, delay: 0.3, ease }}
                    className="hidden lg:flex flex-col gap-4">

                    {/* AI Assistant Card */}
                    <div className="glass-strong rounded-2xl border border-cyan-500/18 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/6 to-violet-600/6 pointer-events-none" />
                      <div className="relative p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-base shadow-lg shadow-cyan-500/25">✨</div>
                          <div>
                            <p className="text-white text-sm font-semibold">AI Discovery Assistant</p>
                            <p className="text-slate-500 text-xs">Real-time intelligence</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 glass rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-green-400 font-medium">Live</span>
                          </div>
                        </div>

                        {/* Trending Now */}
                        <div className="mb-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">🔥 Trending Now</p>
                          <div className="space-y-1.5">
                            {['Samsung Galaxy S24', 'Gaming Laptops', 'Ergonomic Chairs'].map((t, i) => (
                              <motion.button key={t}
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.75 + i * 0.1 }}
                                onClick={() => handleTrending(t.split(' ')[0])}
                                className="w-full flex items-center gap-2.5 px-3 py-2 glass rounded-xl text-xs text-slate-300 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-300 transition-all text-left group">
                                <span className="text-orange-400">↑</span>
                                <span className="flex-1">{t}</span>
                                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Growing Categories */}
                        <div className="mb-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">📈 Growing Categories</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[{ name: 'Electronics', pct: '+18%', color: 'text-cyan-400' }, { name: 'Clothing', pct: '+24%', color: 'text-pink-400' }].map(c => (
                              <div key={c.name} className="px-3 py-2 glass rounded-xl border border-white/5 text-xs">
                                <span className="text-slate-300">{c.name}</span>
                                <span className={`ml-2 font-semibold ${c.color}`}>{c.pct}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Recommended */}
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">🎯 Recommended For You</p>
                          <div className="space-y-1.5">
                            {['Premium Furniture Sets', 'MacBook Pro M3'].map((r, i) => (
                              <motion.button key={r}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 + i * 0.1 }}
                                onClick={() => handleTrending(r.split(' ')[0])}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-violet-300 transition-all text-left bg-gradient-to-r hover:from-violet-500/8 hover:to-transparent">
                                <span className="text-violet-400">✦</span>{r}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: '150+',  l: 'Listings',   i: '📦', c: 'text-cyan-400'   },
                        { v: '4',     l: 'Categories', i: '🗂️',  c: 'text-violet-400' },
                        { v: '4.8★',  l: 'Rating',     i: '⭐', c: 'text-yellow-400' },
                        { v: '24/7',  l: 'Available',  i: '🚀', c: 'text-green-400'  },
                      ].map((s, i) => (
                        <motion.div key={s.l}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.88 + i * 0.1 }}
                          whileHover={{ y: -4, transition: { duration: 0.3 } }}
                          className="glass rounded-2xl p-4 border border-white/5 text-center hover:border-white/10 transition-all">
                          <div className="text-xl mb-1">{s.i}</div>
                          <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* ── TRENDING CHIPS ────────────────────────────────────────── */}
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65, ease }}
                className="border-y border-white/5 py-5 mb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      Trending:
                    </span>
                    {TRENDING_CHIPS.map((t, i) => (
                      <motion.button key={t}
                        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.68 + i * 0.05 }}
                        whileHover={{ scale: 1.08, y: -2, boxShadow: '0 4px 20px rgba(0,212,255,0.15)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTrending(t)}
                        className="px-4 py-1.5 glass rounded-full text-xs text-slate-300 border border-white/8 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/6 transition-all cursor-pointer font-medium">
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* ── TRUST METRICS ─────────────────────────────────────────── */}
              <section ref={statsRef} className="py-16 border-b border-white/5">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { target: '150000', suffix: '+', label: 'Searches',   sub: 'performed daily',   icon: '🔍', color: 'from-cyan-500/15 to-blue-500/15',    border: 'border-cyan-500/20'   },
                      { target: '150',    suffix: '+', label: 'Listings',   sub: 'active right now',  icon: '📦', color: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/20' },
                      { target: '12000',  suffix: '+', label: 'Businesses', sub: 'verified sellers',  icon: '🏪', color: 'from-pink-500/15 to-rose-500/15',     border: 'border-pink-500/20'   },
                      { target: '4',      suffix: '.8★',label: 'Rating',   sub: 'average user score',icon: '⭐', color: 'from-amber-500/15 to-orange-500/15',  border: 'border-amber-500/20'  },
                    ].map((s, i) => (
                      <motion.div key={s.label}
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: statsVisible ? 1 : 0, y: statsVisible ? 0 : 24 }}
                        transition={{ duration: 0.7, delay: i * 0.12 }}
                        whileHover={{ y: -6, transition: { duration: 0.3 } }}
                        className={`glass rounded-2xl p-6 border ${s.border} bg-gradient-to-br ${s.color} text-center`}>
                        <div className="text-3xl mb-3">{s.icon}</div>
                        <div className="text-3xl font-black text-white mb-1">
                          {statsVisible ? <AnimatedCounter target={s.target} suffix={s.suffix} /> : '—'}
                        </div>
                        <div className="text-sm font-semibold text-white mb-0.5">{s.label}</div>
                        <div className="text-xs text-slate-500">{s.sub}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── CATEGORY CARDS ────────────────────────────────────────── */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease }} className="text-center mb-12">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-3">Browse Categories</p>
                  <h2 className="text-4xl font-black text-white mb-3">What are you looking for?</h2>
                  <p className="text-slate-400 max-w-md mx-auto">Choose a category or search directly for instant results.</p>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button key={cat.name}
                      initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease }}
                      whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.35 } }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCatClick(cat.name)}
                      className={`group glass rounded-2xl p-6 border ${cat.border} bg-gradient-to-br ${cat.color} text-left cursor-pointer hover:shadow-2xl ${cat.glow} transition-all duration-400 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.015] -translate-y-8 translate-x-8" />
                      <motion.div className="text-4xl mb-5" whileHover={{ scale: 1.25, rotate: 8, transition: { duration: 0.3 } }}>
                        {cat.icon}
                      </motion.div>
                      <p className="text-white font-bold text-base mb-1">{cat.name}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                        <span className={`text-xs font-semibold ${cat.badge}`}>{cat.count} active listings</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">{cat.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                        <span>Explore</span>
                        <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* ── FEATURED LISTINGS ─────────────────────────────────────── */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }} className="flex items-end justify-between mb-10">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Hand-picked</p>
                    <h2 className="text-4xl font-black text-white">Featured Listings</h2>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setHasSearched(true); fetchAllItems(); }}
                    className="px-5 py-2 glass rounded-xl text-sm text-slate-400 border border-white/8 hover:text-white hover:border-white/20 transition-all hidden sm:flex items-center gap-2">
                    View all <span>→</span>
                  </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {FEATURED.map((item, i) => (
                    <motion.div key={item.title}
                      initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      whileHover={{ y: -8, transition: { duration: 0.32 } }}
                      className="glass rounded-2xl overflow-hidden border border-white/6 group cursor-pointer hover:border-white/14 transition-all">
                      {/* Image */}
                      <div className="h-40 bg-gradient-to-br from-white/4 to-white/[0.01] flex items-center justify-center text-7xl relative border-b border-white/5">
                        <motion.span whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}>{item.img}</motion.span>
                        <span className="absolute top-3 left-3 px-2.5 py-1 glass rounded-full text-xs font-medium text-white border border-white/12 backdrop-blur-sm">
                          {item.badge}
                        </span>
                        {item.verified && (
                          <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs" title="Verified">✓</span>
                        )}
                        {/* Bookmark */}
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                          className="absolute bottom-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-slate-400 hover:text-yellow-400 border border-white/10 transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </motion.button>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs px-2 py-0.5 glass rounded-full text-slate-400 border border-white/8">{item.cat}</span>
                          <span className="flex items-center gap-1 text-xs text-yellow-400 ml-auto">
                            ★ <span className="text-slate-400">{item.rating}</span>
                          </span>
                        </div>
                        <h3 className="text-white font-semibold text-sm group-hover:text-cyan-100 transition-colors line-clamp-1 mb-1">{item.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-white">{item.price}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ── WHY SEARCHAI ──────────────────────────────────────────── */}
              <section className="border-t border-white/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }} className="text-center mb-12">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Why us</p>
                    <h2 className="text-4xl font-black text-white mb-3">Why <span className="gradient-text">SearchAI</span>?</h2>
                    <p className="text-slate-400 max-w-md mx-auto">Built for speed, intelligence, and trust.</p>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {WHY_CARDS.map((c, i) => (
                      <motion.div key={c.title}
                        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        whileHover={{ y: -6, transition: { duration: 0.3 } }}
                        className={`glass rounded-2xl p-6 border ${c.border} bg-gradient-to-br ${c.color}`}>
                        <div className="text-4xl mb-4">{c.icon}</div>
                        <h3 className="text-white font-bold text-base mb-2">{c.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── POPULAR NEAR YOU ──────────────────────────────────────── */}
              <section className="py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }} className="flex items-end justify-between mb-10">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">📍 Near You</p>
                      <h2 className="text-4xl font-black text-white">Popular Near You</h2>
                    </div>
                  </motion.div>
                  <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                    {POPULAR_NEAR_YOU.map((p, i) => (
                      <motion.div key={p.name}
                        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.09 }}
                        whileHover={{ y: -5, transition: { duration: 0.28 } }}
                        className="flex-shrink-0 w-52 glass rounded-2xl p-5 border border-white/6 cursor-pointer hover:border-white/14 transition-all">
                        <div className="text-4xl mb-3">{p.img}</div>
                        <p className="text-white font-semibold text-sm mb-1 line-clamp-1">{p.name}</p>
                        <p className="text-slate-500 text-xs mb-2">{p.cat}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-yellow-400">★ {p.rating} <span className="text-slate-500">({p.reviews})</span></span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {p.distance}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
              <section className="py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }} className="text-center mb-12">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Testimonials</p>
                    <h2 className="text-4xl font-black text-white">Loved by Users</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {TESTIMONIALS.map((t, i) => (
                      <motion.div key={t.name}
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.12 }}
                        whileHover={{ y: -5, transition: { duration: 0.28 } }}
                        className="glass rounded-2xl p-6 border border-white/6 hover:border-white/12 transition-all">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.review}"</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center text-xl">{t.avatar}</div>
                          <div>
                            <p className="text-white text-sm font-semibold">{t.name}</p>
                            <p className="text-slate-500 text-xs">{t.role}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── CTA ───────────────────────────────────────────────────── */}
              <section className="py-16 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="glass rounded-3xl p-10 sm:p-14 border border-white/6 bg-gradient-to-br from-cyan-500/6 to-violet-600/6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/4 via-transparent to-violet-600/4 pointer-events-none" />
                    <div className="relative">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Get Started</p>
                      <h2 className="text-4xl font-black text-white mb-4">
                        The Smarter Way to <span className="gradient-text">Search & Discover</span>
                      </h2>
                      <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        Join thousands of users finding exactly what they need every day.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {!isLoggedIn ? (<>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/register')}
                            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all">
                            Get Started Free →
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            className="px-8 py-3.5 glass rounded-xl text-white font-medium border border-white/12 hover:border-white/24 transition-all">
                            Sign In
                          </motion.button>
                        </>) : (
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setHasSearched(true); fetchAllItems(); }}
                            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25">
                            Browse All Products →
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* ── FOOTER ────────────────────────────────────────────────── */}
              <footer className="border-t border-white/5 py-14 px-4">
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
                    {[
                      { title: 'Product',  links: ['Search', 'Categories', 'Trending', 'New Listings'] },
                      { title: 'Company',  links: ['About', 'Careers', 'Blog', 'Press'] },
                      { title: 'Support',  links: ['Help Center', 'Contact', 'Status', 'Community'] },
                      { title: 'Legal',    links: ['Privacy', 'Terms', 'Cookies', 'Licenses'] },
                    ].map(col => (
                      <div key={col.title}>
                        <p className="text-white font-semibold text-sm mb-4">{col.title}</p>
                        <div className="space-y-2.5">
                          {col.links.map(l => (
                            <p key={l} className="text-slate-500 text-sm hover:text-slate-300 cursor-pointer transition-colors">{l}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold">⚡</div>
                      <span className="font-bold text-white">Search<span className="text-neon-blue">AI</span></span>
                    </div>
                    <p className="text-slate-600 text-xs text-center">
                      © 2024 SearchAI · Built with React + Spring Boot + PostgreSQL
                    </p>
                    <div className="flex items-center gap-3">
                      {['𝕏', '📘', '💼', '📷'].map(icon => (
                        <button key={icon} className="w-8 h-8 glass rounded-full flex items-center justify-center text-slate-500 hover:text-white border border-white/5 hover:border-white/15 transition-all text-xs">
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </footer>

            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SEARCH RESULTS
          ══════════════════════════════════════════════════════════════════ */}
          {hasSearched && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}>
              {/* Compact search header */}
              <div className="px-4 sm:px-6 max-w-7xl mx-auto mb-6 pt-4">
                <PremiumSearchBar keyword={keyword} setKeyword={setKeyword} onSearch={handleSearch} />
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <span className="text-slate-500 text-xs">Trending:</span>
                  {TRENDING_CHIPS.slice(0, 6).map(t => (
                    <button key={t} onClick={() => handleTrending(t)}
                      className="px-3 py-1 glass rounded-full text-xs text-slate-400 border border-white/5 hover:text-cyan-300 hover:border-cyan-500/20 transition-all">
                      {t}
                    </button>
                  ))}
                  <button onClick={() => { setHasSearched(false); setKeyword(''); fetchAllItems(); }}
                    className="ml-auto text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                    ← Back to home
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <div className="flex flex-col md:flex-row gap-6">
                  <FilterPanel categories={categories} selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory} priceRange={priceRange} setPriceRange={setPriceRange} />
                  <div className="flex-1 min-w-0">
                    {!loading && (
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-slate-400">
                            {filteredItems.length > 0
                              ? <><span className="text-white font-semibold">{filteredItems.length}</span> results</>
                              : 'No results'}
                            {selectedCategory && categories.find(c => String(c.id) === selectedCategory) &&
                              <> in <span className="text-cyan-300 font-medium">{categories.find(c => String(c.id) === selectedCategory)?.name}</span></>}
                          </p>
                          {selectedCategory && (
                            <button onClick={() => setSelectedCategory('')}
                              className="text-xs text-slate-500 hover:text-white glass px-2 py-0.5 rounded-full border border-white/5 transition-all">
                              ✕ Clear
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="glass rounded-xl px-4 py-3 border border-red-500/20 text-red-400 text-sm mb-4">
                          ⚠️ {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loading && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                      </div>
                    )}

                    {!loading && filteredItems.length === 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24">
                        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity }}
                          className="text-7xl mb-5">🔍</motion.div>
                        <p className="text-white font-bold text-xl mb-2">Nothing found</p>
                        <p className="text-slate-400 text-sm mb-6">Try a different keyword or reset filters</p>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedCategory(''); setPriceRange(200000); setKeyword(''); fetchAllItems(); }}
                          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold shadow-lg shadow-cyan-500/20">
                          Reset Everything
                        </motion.button>
                      </motion.div>
                    )}

                    {!loading && filteredItems.length > 0 && (
                      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                          {filteredItems.map((item, i) => <ResultCard key={item.id} item={item} index={i} />)}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Home;
