import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllItems, getAllCategories, searchItems } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK / STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',       icon: '⬡' },
  { id: 'explore',       label: 'Explore',          icon: '🔍' },
  { id: 'saved',         label: 'Saved Items',      icon: '❤️', badge: 4 },
  { id: 'searches',      label: 'Saved Searches',   icon: '🔖' },
  { id: 'recommendations',label: 'For You',         icon: '✨' },
  { id: 'recent',        label: 'Recently Viewed',  icon: '🕐' },
  { id: 'notifications', label: 'Notifications',    icon: '🔔', badge: 3 },
  { id: 'profile',       label: 'Profile',          icon: '👤' },
  { id: 'settings',      label: 'Settings',         icon: '⚙️' },
];

const SAVED_SEARCHES = [
  { id: 1, q: 'Gaming Laptops',        alert: true  },
  { id: 2, q: 'Samsung Smartphones',   alert: false },
  { id: 3, q: 'Ergonomic Chairs',      alert: true  },
  { id: 4, q: 'Office Furniture',      alert: false },
  { id: 5, q: 'Men\'s Watches',        alert: true  },
];

const NOTIFICATIONS = [
  { id: 1, icon: '📉', msg: 'Price drop on "Sony WH-1000XM5" — now ₹26,999',   time: '5m ago',  unread: true,  type: 'price'   },
  { id: 2, icon: '🆕', msg: 'New listing matches "Gaming Laptops" alert',        time: '1h ago',  unread: true,  type: 'alert'   },
  { id: 3, icon: '✅', msg: 'Your saved search "Samsung Phones" has 3 new items',time: '3h ago',  unread: true,  type: 'match'   },
  { id: 4, icon: '⭐', msg: 'You have 4 saved items — explore similar products', time: '1d ago',  unread: false, type: 'tip'     },
  { id: 5, icon: '🏷️', msg: 'Flash sale: Electronics up to 30% off today',      time: '2d ago',  unread: false, type: 'sale'    },
];

const RECENTLY_VIEWED = [
  { title: 'iPhone 15 Pro Max',        cat: 'Electronics', price: '₹1,34,900', time: '2m ago',  img: '📱' },
  { title: 'Sony WH-1000XM5',          cat: 'Electronics', price: '₹29,990',   time: '15m ago', img: '🎧' },
  { title: 'Ergonomic Office Chair',   cat: 'Furniture',   price: '₹18,999',   time: '1h ago',  img: '🪑' },
  { title: 'MacBook Air M2',           cat: 'Electronics', price: '₹1,14,900', time: '3h ago',  img: '💻' },
  { title: 'Slim Fit Oxford Shirt',    cat: 'Clothing',    price: '₹1,299',    time: '5h ago',  img: '👔' },
];

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'New Search',      color: 'from-cyan-500/15 to-blue-500/15',    border: 'border-cyan-500/25',   action: 'explore'       },
  { icon: '❤️', label: 'View Favourites', color: 'from-pink-500/15 to-rose-500/15',    border: 'border-pink-500/25',   action: 'saved'         },
  { icon: '🔔', label: 'Manage Alerts',   color: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/25',  action: 'searches'      },
  { icon: '✨', label: 'For You',         color: 'from-violet-500/15 to-purple-500/15',border: 'border-violet-500/25', action: 'recommendations'},
  { icon: '🤖', label: 'AI Assistant',    color: 'from-green-500/15 to-emerald-500/15',border: 'border-green-500/25',  action: 'explore'       },
];

const CAT_COLORS = { Electronics: '#00d4ff', Clothing: '#f472b6', Furniture: '#f59e0b', Books: '#a78bfa' };
const CAT_ICONS  = { Electronics: '💻', Clothing: '👕', Furniture: '🪑', Books: '📚' };
const ease       = [0.25, 0.1, 0.25, 1];

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#00d4ff', h = 28 }) {
  const max = Math.max(...data);
  const w   = 80;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD (for explore / recommendations / saved)
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ item, saved, onToggleSave, index = 0 }) {
  const cat   = item.category?.name || 'Other';
  const clr   = CAT_COLORS[cat]     || '#64748b';
  const icon  = CAT_ICONS[cat]      || '📦';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="glass rounded-2xl overflow-hidden border border-white/6 group cursor-pointer hover:border-white/14 transition-all"
    >
      {/* Thumbnail */}
      <div className="h-32 flex items-center justify-center text-5xl relative border-b border-white/5"
        style={{ background: `linear-gradient(135deg, ${clr}12, ${clr}04)` }}>
        <motion.span whileHover={{ scale: 1.15, transition: { duration: 0.3 } }}>{icon}</motion.span>
        <span className="absolute top-2.5 left-2.5 text-xs px-2.5 py-1 glass rounded-full border border-white/10 text-white">{cat}</span>
        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
          onClick={e => { e.stopPropagation(); onToggleSave(item.id); }}
          className="absolute top-2.5 right-2.5 w-7 h-7 glass rounded-full flex items-center justify-center border border-white/10 transition-all"
          style={{ color: saved ? '#f472b6' : '#64748b' }}
        >
          {saved ? '❤️' : '🤍'}
        </motion.button>
      </div>
      {/* Body */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-cyan-100 transition-colors mb-1">{item.title}</h3>
        <p className="text-slate-500 text-xs line-clamp-1 mb-3">{item.description || 'No description'}</p>
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-base">₹{item.price?.toLocaleString('en-IN')}</span>
          <div className="flex items-center gap-1 text-xs text-yellow-400">
            ★ <span className="text-slate-400">4.{5 + (item.id % 4)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate  = useNavigate();
  const username  = localStorage.getItem('username') || 'User';
  const token     = localStorage.getItem('token');

  useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);

  const [activeSection,  setActiveSection]  = useState('dashboard');
  const [sidebarOpen,    setSidebarOpen]     = useState(true);
  const [items,          setItems]           = useState([]);
  const [categories,     setCategories]      = useState([]);
  const [savedIds,       setSavedIds]        = useState([1, 3, 5, 7]);
  const [notifications,  setNotifications]   = useState(NOTIFICATIONS);
  const [savedSearches,  setSavedSearches]   = useState(SAVED_SEARCHES);
  const [searchQ,        setSearchQ]         = useState('');
  const [searchResults,  setSearchResults]   = useState([]);
  const [searching,      setSearching]       = useState(false);
  const [profileComplete] = useState(72);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [iRes, cRes] = await Promise.all([getAllItems(), getAllCategories()]);
      setItems(iRes.data || []);
      setCategories(cRes.data || []);
    } catch {}
  };

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await searchItems(q);
      setSearchResults(r.data || []);
    } catch {} finally { setSearching(false); }
  }, []);

  const toggleSave = (id) => setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const deleteSearch = (id) => setSavedSearches(prev => prev.filter(s => s.id !== id));
  const toggleAlert  = (id) => setSavedSearches(prev => prev.map(s => s.id === id ? { ...s, alert: !s.alert } : s));
  const markAllRead  = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const unreadCount  = notifications.filter(n => n.unread).length;

  const savedItems   = items.filter(i => savedIds.includes(i.id));
  const recommended  = items.filter(i => !savedIds.includes(i.id)).slice(0, 6);
  const catBreakdown = categories.map(c => ({
    name: c.name, count: items.filter(i => i.category?.id === c.id).length,
    color: CAT_COLORS[c.name] || '#64748b', icon: CAT_ICONS[c.name] || '📦',
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">

      {/* BG orbs */}
      <motion.div className="orb w-[500px] h-[500px] bg-cyan-500 -top-40 -left-40 pointer-events-none"
        animate={{ x: [0,30,0], y:[0,20,0] }} transition={{ duration:22, repeat:Infinity, ease:'easeInOut' }}
        style={{ opacity:0.05 }} />
      <motion.div className="orb w-[400px] h-[400px] bg-violet-600 bottom-0 right-0 pointer-events-none"
        animate={{ x:[0,-20,0], y:[0,-25,0] }} transition={{ duration:26, repeat:Infinity, ease:'easeInOut' }}
        style={{ opacity:0.07 }} />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.35, ease }}
        className="relative z-30 flex flex-col glass border-r border-white/6 flex-shrink-0 overflow-hidden"
      >
        {/* Toggle */}
        <button onClick={() => setSidebarOpen(o => !o)}
          className="absolute top-5 -right-3 w-6 h-6 glass rounded-full border border-white/12 flex items-center justify-center text-slate-400 hover:text-white transition-all z-10 text-xs">
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg shadow-cyan-500/20">⚡</div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="font-bold text-sm text-white">Search<span className="text-neon-blue">AI</span></span>
              <p className="text-xs text-slate-500">My Dashboard</p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV.map(item => {
            const realBadge = item.id === 'notifications' ? unreadCount : item.badge;
            return (
              <motion.button key={item.id}
                whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-cyan-500/18 to-violet-600/12 text-cyan-300 border border-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                {realBadge > 0 && sidebarOpen && (
                  <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">{realBadge}</span>
                )}
                {realBadge > 0 && !sidebarOpen && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {username[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{username}</p>
                <p className="text-xs text-slate-500">Free Plan</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-14 glass border-b border-white/6 flex items-center justify-between px-5 flex-shrink-0 z-20">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-white font-semibold capitalize">{activeSection.replace('-',' ')}</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 glass rounded-xl text-xs text-slate-400 border border-white/8 hover:text-white transition-all">
              ← Back to Search
            </motion.button>
            <button onClick={() => setActiveSection('notifications')}
              className="relative p-2 glass rounded-xl border border-white/8 text-slate-400 hover:text-white transition-all">
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold">
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">

            {/* ══ DASHBOARD ══════════════════════════════════════════════ */}
            {activeSection === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

                {/* Welcome hero */}
                <div className="glass rounded-3xl p-6 sm:p-8 border border-white/6 bg-gradient-to-br from-cyan-500/8 via-transparent to-violet-600/8 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/5 -translate-y-24 translate-x-24 pointer-events-none" />
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">{greeting} 👋</p>
                        <h1 className="text-3xl font-black text-white mb-2">Welcome back, <span className="gradient-text">{username}</span></h1>
                        <p className="text-slate-400 text-sm max-w-md">Discover new products, track saved searches, and get personalised recommendations.</p>
                      </div>
                      {/* AI search bar */}
                      <div className="flex-1 max-w-md">
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); handleSearch(e.target.value); }}
                            onKeyDown={e => e.key === 'Enter' && setActiveSection('explore')}
                            placeholder="Search products, jobs, properties..."
                            className="w-full glass-strong rounded-2xl pl-10 pr-14 py-3.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-cyan-500/40 transition-all bg-transparent" />
                          <button onClick={() => setActiveSection('explore')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-xs font-semibold">
                            Search
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Saved Items',    value: savedIds.length,    icon: '❤️', trend: '+2',  spark: [1,2,2,3,3,4,4], color: '#f472b6', border: 'border-pink-500/20',   bg: 'from-pink-500/10 to-rose-500/10'    },
                    { label: 'Saved Searches', value: savedSearches.length,icon:'🔖', trend: '+1',  spark: [1,1,2,2,3,3,4], color: '#a78bfa', border: 'border-violet-500/20', bg: 'from-violet-500/10 to-purple-500/10'},
                    { label: 'New Matches',    value: 12,                  icon: '✨', trend: '+5',  spark: [2,4,3,6,5,8,7], color: '#00d4ff', border: 'border-cyan-500/20',   bg: 'from-cyan-500/10 to-blue-500/10'   },
                    { label: 'Notifications',  value: unreadCount,         icon: '🔔', trend: `${unreadCount} new`, spark:[1,1,2,1,3,2,3], color:'#f59e0b', border:'border-amber-500/20', bg:'from-amber-500/10 to-orange-500/10'},
                  ].map((k, i) => (
                    <motion.div key={k.label}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4, transition: { duration: 0.25 } }}
                      className={`glass rounded-2xl p-5 border ${k.border} bg-gradient-to-br ${k.bg}`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{k.icon}</span>
                        <span className="text-xs text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">{k.trend}</span>
                      </div>
                      <p className="text-2xl font-black text-white mb-0.5">{k.value}</p>
                      <p className="text-xs text-slate-500 mb-3">{k.label}</p>
                      <Sparkline data={k.spark} color={k.color} />
                    </motion.div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Quick Actions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {QUICK_ACTIONS.map((a, i) => (
                      <motion.button key={a.label}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -4, transition: { duration: 0.25 } }} whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveSection(a.action)}
                        className={`glass rounded-2xl p-4 border ${a.border} bg-gradient-to-br ${a.color} text-center`}>
                        <div className="text-3xl mb-2">{a.icon}</div>
                        <p className="text-xs text-white font-medium">{a.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Two-col: AI Insights + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                  {/* AI Insights widget */}
                  <div className="glass rounded-2xl p-5 border border-cyan-500/15 bg-gradient-to-br from-cyan-500/6 to-violet-600/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/4 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs">✨</div>
                        <h3 className="text-white font-semibold text-sm">AI Insights</h3>
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { icon: '🔥', label: 'Trending Near You',          val: 'Samsung S24, MacBook Air'    },
                          { icon: '📈', label: 'Growing This Week',           val: 'Electronics +18%, Clothing +12%' },
                          { icon: '💡', label: 'Suggested for You',           val: 'Gaming Laptops, Office Chairs' },
                          { icon: '📍', label: 'Local Opportunities',         val: '12 new listings near Bengaluru' },
                          { icon: '🎯', label: 'Personalised Picks',          val: 'Based on your 8 searches' },
                        ].map((r, i) => (
                          <motion.div key={r.label}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                            className="flex items-center gap-3 px-3 py-2.5 glass rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer group">
                            <span className="text-lg flex-shrink-0">{r.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 group-hover:text-white transition-colors">{r.label}</p>
                              <p className="text-xs text-cyan-300 truncate">{r.val}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recently Viewed */}
                  <div className="glass rounded-2xl p-5 border border-white/6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm">Recently Viewed</h3>
                      <button onClick={() => setActiveSection('recent')} className="text-xs text-cyan-400 hover:text-cyan-300">View all →</button>
                    </div>
                    <div className="space-y-2.5">
                      {RECENTLY_VIEWED.slice(0, 4).map((r, i) => (
                        <motion.div key={r.title}
                          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="flex items-center gap-3 p-2.5 glass rounded-xl border border-white/5 hover:border-white/12 transition-all cursor-pointer group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: `${CAT_COLORS[r.cat] || '#64748b'}15` }}>
                            {r.img}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate group-hover:text-cyan-100 transition-colors">{r.title}</p>
                            <p className="text-xs text-slate-500">{r.cat} · {r.price}</p>
                          </div>
                          <span className="text-xs text-slate-600 flex-shrink-0">{r.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="glass rounded-2xl p-5 border border-white/6">
                  <h3 className="text-white font-semibold text-sm mb-4">Your Favourite Categories</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {catBreakdown.map((c, i) => (
                      <motion.button key={c.name}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                        whileHover={{ y: -3, transition: { duration: 0.25 } }}
                        onClick={() => setActiveSection('explore')}
                        className="glass rounded-xl p-4 border border-white/6 hover:border-white/14 transition-all text-left group">
                        <div className="text-2xl mb-2">{c.icon}</div>
                        <p className="text-white text-xs font-semibold mb-0.5">{c.name}</p>
                        <p className="text-xs font-bold" style={{ color: c.color }}>{c.count} listings</p>
                        <div className="mt-2 h-1 rounded-full bg-white/8">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${Math.min((c.count / Math.max(...catBreakdown.map(x=>x.count), 1)) * 100, 100)}%` }}
                            transition={{ duration: 1.1, delay: i * 0.1 }}
                            className="h-full rounded-full" style={{ backgroundColor: c.color }} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ EXPLORE ════════════════════════════════════════════════ */}
            {activeSection === 'explore' && (
              <motion.div key="explore" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white mb-1">Explore</h2>
                  <p className="text-slate-500 text-sm">Search and discover across all categories</p>
                </div>
                {/* Search */}
                <div className="relative mb-6">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input value={searchQ} onChange={e => { setSearchQ(e.target.value); handleSearch(e.target.value); }}
                    placeholder="Search products, laptops, chairs, shirts..."
                    className="w-full glass-strong rounded-2xl pl-12 pr-5 py-4 text-base text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-cyan-500/40 transition-all bg-transparent" />
                </div>
                {/* Results or all items */}
                {searching ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="glass rounded-2xl p-5 border border-white/5 space-y-3 animate-pulse">
                        <div className="skeleton h-28 w-full rounded-xl" />
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-4 w-1/2 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(searchResults.length > 0 ? searchResults : items).map((item, i) => (
                      <ProductCard key={item.id} item={item} saved={savedIds.includes(item.id)} onToggleSave={toggleSave} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ SAVED ITEMS ════════════════════════════════════════════ */}
            {activeSection === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Saved Items</h2>
                    <p className="text-slate-500 text-sm">{savedItems.length} bookmarked listings</p>
                  </div>
                </div>
                {savedItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">💔</div>
                    <p className="text-white font-bold text-lg mb-2">No saved items yet</p>
                    <p className="text-slate-400 text-sm mb-6">Browse listings and tap the heart to save them</p>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveSection('explore')}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold">
                      Start Exploring
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {savedItems.map((item, i) => (
                      <ProductCard key={item.id} item={item} saved={true} onToggleSave={toggleSave} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ SAVED SEARCHES ═════════════════════════════════════════ */}
            {activeSection === 'searches' && (
              <motion.div key="searches" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">Saved Searches</h2>
                  <p className="text-slate-500 text-sm">Manage your saved search alerts</p>
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                  {savedSearches.map((s, i) => (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-2 glass rounded-full pl-4 pr-2 py-2 border border-white/8 group hover:border-cyan-500/30 transition-all">
                      <span className="text-sm text-white font-medium">{s.q}</span>
                      <button onClick={() => toggleAlert(s.id)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${s.alert ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' : 'glass text-slate-500 border-white/8 hover:text-slate-300'}`}
                        title={s.alert ? 'Alerts on' : 'Alerts off'}>
                        {s.alert ? '🔔' : '🔕'}
                      </button>
                      <button onClick={() => deleteSearch(s.id)}
                        className="p-1.5 glass rounded-full border border-white/8 text-slate-500 hover:text-red-400 hover:border-red-500/25 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
                {savedSearches.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-12">No saved searches yet.</p>
                )}
                <div className="glass rounded-2xl p-5 border border-white/6">
                  <h3 className="text-white font-semibold text-sm mb-4">Add New Saved Search</h3>
                  <form onSubmit={e => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) { setSavedSearches(prev => [...prev, { id: Date.now(), q, alert: true }]); e.target.reset(); }}} className="flex gap-3">
                    <input name="q" placeholder="e.g. Gaming Laptop under ₹80,000"
                      className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-cyan-500/40 transition-all bg-transparent" />
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold">
                      Save
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ══ RECOMMENDATIONS ════════════════════════════════════════ */}
            {activeSection === 'recommendations' && (
              <motion.div key="recs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">For You</h2>
                  <p className="text-slate-500 text-sm">Personalised picks based on your activity</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-cyan-500/15 bg-gradient-to-r from-cyan-500/6 to-violet-600/5 mb-6 flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <p className="text-sm text-slate-300">AI matched <span className="text-cyan-300 font-semibold">{recommended.length} listings</span> based on your search history and saved items.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommended.map((item, i) => (
                    <ProductCard key={item.id} item={item} saved={savedIds.includes(item.id)} onToggleSave={toggleSave} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ RECENTLY VIEWED ════════════════════════════════════════ */}
            {activeSection === 'recent' && (
              <motion.div key="recent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">Recently Viewed</h2>
                  <p className="text-slate-500 text-sm">Your browsing history</p>
                </div>
                <div className="glass rounded-2xl border border-white/6 divide-y divide-white/5">
                  {RECENTLY_VIEWED.map((r, i) => (
                    <motion.div key={r.title}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${CAT_COLORS[r.cat] || '#64748b'}15` }}>
                        {r.img}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm group-hover:text-cyan-100 transition-colors">{r.title}</p>
                        <p className="text-slate-500 text-xs">{r.cat} · {r.price}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">{r.time}</p>
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => toggleSave(i + 100)}
                          className="text-xs text-slate-600 hover:text-pink-400 transition-colors mt-1">Save</motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ NOTIFICATIONS ══════════════════════════════════════════ */}
            {activeSection === 'notifications' && (
              <motion.div key="notifs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Notifications</h2>
                    <p className="text-slate-500 text-sm">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="px-4 py-2 glass rounded-xl text-xs text-slate-400 border border-white/8 hover:text-white transition-all">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                      className={`flex items-center gap-4 px-5 py-4 glass rounded-2xl border transition-all cursor-pointer hover:border-white/14 ${n.unread ? 'border-cyan-500/20 bg-cyan-500/4' : 'border-white/5'}`}>
                      <div className="w-10 h-10 rounded-xl glass border border-white/8 flex items-center justify-center text-xl flex-shrink-0">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.unread ? 'text-white font-medium' : 'text-slate-400'}`}>{n.msg}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ PROFILE ════════════════════════════════════════════════ */}
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">Profile</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Profile card */}
                  <div className="glass rounded-2xl p-6 border border-white/6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                      {username[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-0.5">{username}</h3>
                    <p className="text-slate-500 text-sm mb-4">{username.toLowerCase()}@example.com</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 glass rounded-full border border-cyan-500/25 text-cyan-300 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Free Plan
                    </div>
                    {/* Profile completion */}
                    <div className="mt-5 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">Profile completion</span>
                        <span className="text-xs font-semibold text-cyan-300">{profileComplete}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${profileComplete}%` }} transition={{ duration: 1.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">Add your location and interests to reach 100%</p>
                    </div>
                  </div>

                  {/* Stats + interests */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="glass rounded-2xl p-5 border border-white/6">
                      <h3 className="text-white font-semibold text-sm mb-4">Activity Analytics</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Searches',         value: '47',  icon: '🔍', color: 'text-cyan-400'   },
                          { label: 'Saved Items',       value: savedIds.length, icon: '❤️', color: 'text-pink-400'   },
                          { label: 'Saved Searches',    value: savedSearches.length, icon: '🔖', color: 'text-violet-400' },
                          { label: 'Rec. Clicked',      value: '12',  icon: '✨', color: 'text-amber-400'  },
                        ].map((s, i) => (
                          <div key={s.label} className="glass rounded-xl p-3 border border-white/6 text-center">
                            <div className="text-xl mb-1">{s.icon}</div>
                            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-5 border border-white/6">
                      <h3 className="text-white font-semibold text-sm mb-3">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Electronics','Laptops','Smartphones','Office Furniture','Men\'s Fashion','Books'].map(tag => (
                          <span key={tag} className="px-3 py-1 glass rounded-full text-xs text-slate-300 border border-white/8">{tag}</span>
                        ))}
                        <button className="px-3 py-1 glass rounded-full text-xs text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/10 transition-all">+ Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ SETTINGS ═══════════════════════════════════════════════ */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">Settings</h2>
                  <p className="text-slate-500 text-sm">Manage your account preferences</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { title: 'Account',         desc: 'Update name, email, password',    icon: '👤' },
                    { title: 'Notifications',   desc: 'Email alerts, push, frequency',   icon: '🔔' },
                    { title: 'Privacy',         desc: 'Data, visibility, tracking',       icon: '🔒' },
                    { title: 'Appearance',      desc: 'Theme, language, accessibility',  icon: '🎨' },
                    { title: 'Search Alerts',   desc: 'Manage saved search alerts',      icon: '🔖' },
                    { title: 'Delete Account',  desc: 'Permanently remove your data',    icon: '🗑️' },
                  ].map((s, i) => (
                    <motion.div key={s.title}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -3, transition: { duration: 0.25 } }}
                      className={`glass rounded-2xl p-5 border border-white/6 hover:border-white/14 transition-all flex items-center gap-4 cursor-pointer ${s.title === 'Delete Account' ? 'hover:border-red-500/25' : ''}`}>
                      <div className="w-11 h-11 rounded-xl glass border border-white/8 flex items-center justify-center text-2xl flex-shrink-0">{s.icon}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${s.title === 'Delete Account' ? 'text-red-400' : 'text-white'}`}>{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
