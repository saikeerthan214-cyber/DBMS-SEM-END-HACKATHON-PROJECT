import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllItems, addItem, updateItem, deleteItem,
  getAllCategories, addCategory, deleteCategory,
  getAllUsers, deleteUser,
  getAnalytics, getSearchLogs, deleteSearchLog,
} from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '⬡' },
  { id: 'listings',    label: 'Listings',     icon: '📦' },
  { id: 'categories',  label: 'Categories',   icon: '🗂️' },
  { id: 'users',       label: 'Users',        icon: '👥' },
  { id: 'searchlogs',  label: 'Search Logs',  icon: '🔍' },
  { id: 'approvals',   label: 'Approvals',    icon: '✅', badge: 3 },
  { id: 'analytics',   label: 'Analytics',    icon: '📈' },
  { id: 'activity',    label: 'Activity',     icon: '⚡' },
  { id: 'health',      label: 'Health',       icon: '🛡️' },
  { id: 'settings',    label: 'Settings',     icon: '⚙️' },
];

// MOCK_USERS removed — now loaded live from GET /api/users

const MOCK_ACTIVITY = [
  { icon: '📦', msg: 'New listing "iPhone 15 Pro" added',       time: '2m ago',  color: 'text-cyan-400'   },
  { icon: '👤', msg: 'User "arjun@example.com" registered',     time: '8m ago',  color: 'text-green-400'  },
  { icon: '✅', msg: 'Listing "MacBook Air M2" approved',       time: '15m ago', color: 'text-violet-400' },
  { icon: '🗑️', msg: 'Listing "Old TV" deleted by admin',      time: '32m ago', color: 'text-red-400'    },
  { icon: '🗂️', msg: 'Category "Electronics" updated',         time: '1h ago',  color: 'text-amber-400'  },
  { icon: '🚩', msg: 'Listing "Fake Watch" reported',           time: '2h ago',  color: 'text-pink-400'   },
  { icon: '✅', msg: 'Business "TechZone" verified',            time: '3h ago',  color: 'text-green-400'  },
];

const HEALTH_METRICS = [
  { label: 'Database',      status: 'Operational', ms: '12ms',   icon: '🗄️',  color: 'text-green-400', bar: 'bg-green-400' },
  { label: 'API Server',    status: 'Operational', ms: '45ms',   icon: '🔌',  color: 'text-green-400', bar: 'bg-green-400' },
  { label: 'Search Engine', status: 'Operational', ms: '8ms',    icon: '🔍',  color: 'text-green-400', bar: 'bg-green-400' },
  { label: 'Storage',       status: '68% Used',    ms: '99.9%',  icon: '💾',  color: 'text-amber-400', bar: 'bg-amber-400' },
];

// Sparkline bar heights (mock trend data)
const SPARKS = {
  listings:   [3, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15],
  users:      [2, 3, 3, 4, 5, 4, 6, 7,  6,  8,  9,  10],
  searches:   [10,14,12,18,16,22,19,25,23,28,26,30],
  revenue:    [5, 6, 5, 8, 7, 9, 8, 11, 9, 12, 11, 14],
  approvals:  [1, 2, 1, 3, 2, 4, 3, 5,  4, 6,  5,  7],
  reported:   [0, 1, 0, 1, 1, 2, 1, 2,  1, 3,  2,  3],
};

const CAT_COLORS = { Electronics: '#00d4ff', Clothing: '#f472b6', Furniture: '#f59e0b', Books: '#a78bfa' };
const CAT_ICONS  = { Electronics: '💻', Clothing: '👕', Furniture: '🪑', Books: '📚' };

const ease = [0.25, 0.1, 0.25, 1];

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#00d4ff' }) {
  const max = Math.max(...data);
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, label, color = '#00d4ff' }) {
  const max = Math.max(...data);
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 h-28">
        {data.map((v, i) => (
          <motion.div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease }}
              style={{ height: `${(v / max) * 100}%`, backgroundColor: color, originY: 1, opacity: 0.75 }}
              className="w-full rounded-t-sm min-h-[4px] hover:opacity-100 transition-opacity cursor-pointer"
              title={`${labels[i]}: ${v}`}
            />
          </motion.div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-slate-600 text-[8px]">{l}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────────────────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  const r = 36, cx = 44, cy = 44, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        {segments.map((seg, i) => {
          const pct  = seg.value / total;
          const dash = pct * circ;
          const gap  = circ - dash;
          const el   = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="10"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.8s ease' }}
            />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-400">{s.label}</span>
            <span className="text-white font-semibold ml-auto">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, trend, trendUp, spark, color, border, bg }) {
  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.28 } }}
      className={`glass rounded-2xl p-5 border ${border} bg-gradient-to-br ${bg} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${bg} border ${border}`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      </div>
      <p className="text-2xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs text-slate-500 mb-3">{label}</p>
      <Sparkline data={spark} color={color} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE-OVER MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SlideOver({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-strong border-l border-white/8 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button onClick={onClose} className="p-2 glass rounded-xl border border-white/8 hover:border-white/18 text-slate-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const role     = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  useEffect(() => { if (role !== 'ADMIN') navigate('/login'); }, [role, navigate]);

  const [activeSection,  setActiveSection]  = useState('dashboard');
  const [sidebarOpen,    setSidebarOpen]     = useState(true);
  const [items,          setItems]           = useState([]);
  const [categories,     setCategories]      = useState([]);
  const [users,          setUsers]           = useState([]);
  const [analytics,      setAnalytics]       = useState(null);
  const [searchLogs,     setSearchLogs]      = useState([]);
  const [searchQuery,    setSearchQuery]     = useState('');
  const [catFilter,      setCatFilter]       = useState('');
  const [sortBy,         setSortBy]          = useState('title');
  const [sortDir,        setSortDir]         = useState('asc');
  const [page,           setPage]            = useState(1);
  const [selectedIds,    setSelectedIds]     = useState([]);
  const [showAddItem,    setShowAddItem]      = useState(false);
  const [showAddCat,     setShowAddCat]       = useState(false);
  const [editItem,       setEditItem]         = useState(null);
  const [itemForm,       setItemForm]        = useState({ title: '', description: '', price: '', categoryId: '', status: 'Active' });
  const [catForm,        setCatForm]         = useState({ name: '', description: '' });
  const [itemError,      setItemError]       = useState('');
  const [catError,       setCatError]        = useState('');
  const [notifications,  setNotifications]   = useState(3);
  const [globalSearch,   setGlobalSearch]    = useState('');
  const PAGE_SIZE = 8;

  useEffect(() => { loadItems(); loadCategories(); loadUsers(); loadAnalytics(); loadSearchLogs(); }, []);

  const loadItems      = async () => { try { const r = await getAllItems();      setItems(r.data);      } catch { setItemError('Failed to load items.'); } };
  const loadCategories = async () => { try { const r = await getAllCategories(); setCategories(r.data); } catch {} };
  const loadUsers      = async () => { try { const r = await getAllUsers();      setUsers(r.data || []); } catch {} };
  const loadAnalytics  = async () => { try { const r = await getAnalytics();    setAnalytics(r.data);  } catch {} };
  const loadSearchLogs = async () => { try { const r = await getSearchLogs();   setSearchLogs(r.data || []); } catch {} };

  const handleAddItem = async (e) => {
    e.preventDefault(); setItemError('');
    try {
      const payload = { title: itemForm.title, description: itemForm.description, price: parseFloat(itemForm.price), categoryId: itemForm.categoryId ? Number(itemForm.categoryId) : null };
      if (editItem) {
        await updateItem(editItem.id, payload);
        setEditItem(null);
      } else {
        await addItem(payload);
      }
      setItemForm({ title: '', description: '', price: '', categoryId: '', status: 'Active' });
      setShowAddItem(false); loadItems();
    } catch { setItemError('Failed to save item.'); }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try { await deleteItem(id); loadItems(); } catch { setItemError('Failed to delete.'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected listings?`)) return;
    await Promise.all(selectedIds.map(id => deleteItem(id)));
    setSelectedIds([]); loadItems();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault(); setCatError('');
    try { await addCategory(catForm); setCatForm({ name: '', description: '' }); setShowAddCat(false); loadCategories(); }
    catch { setCatError('Failed to add category.'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategory(id); loadCategories(); } catch {}
  };

  const toggleSort = (col) => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('asc'); } };
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll    = () => setSelectedIds(prev => prev.length === filteredItems.length ? [] : filteredItems.map(i => i.id));

  // Filter + sort + paginate
  const filteredItems = items
    .filter(item => {
      const q  = searchQuery.toLowerCase();
      const matchQ   = !q || item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      const matchCat = !catFilter || item.category?.name === catFilter;
      return matchQ && matchCat;
    })
    .sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'category') { av = a.category?.name || ''; bv = b.category?.name || ''; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const totalPages   = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems   = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const avgPrice     = items.length ? Math.round(items.reduce((s, i) => s + (i.price || 0), 0) / items.length) : 0;

  // Category breakdown
  const catBreakdown = categories.map(c => ({
    label: c.name,
    value: items.filter(i => i.category?.id === c.id).length,
    color: CAT_COLORS[c.name] || '#64748b',
  })).filter(x => x.value > 0);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
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

        {/* Logo */}
        <div className="px-4 pb-4 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg shadow-cyan-500/20">⚡</div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <span className="font-bold text-sm text-white whitespace-nowrap">Search<span className="text-neon-blue">AI</span></span>
                <p className="text-xs text-slate-500 whitespace-nowrap">Admin Console</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => (
            <motion.button key={item.id}
              whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-cyan-500/18 to-violet-600/12 text-cyan-300 border border-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              {item.badge && sidebarOpen && (
                <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.badge && !sidebarOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400" />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Bottom user */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{username || 'Admin'}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <header className="h-16 glass border-b border-white/6 flex items-center justify-between px-5 flex-shrink-0 z-20">
          {/* Global search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search listings, users, categories..."
                className="w-full glass rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-cyan-500/35 transition-all bg-transparent" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick add */}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setActiveSection('listings'); setShowAddItem(true); }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-xs font-semibold shadow-lg shadow-cyan-500/20">
              <span>+</span> New Listing
            </motion.button>

            {/* Notifications */}
            <button onClick={() => setNotifications(0)}
              className="relative p-2 glass rounded-xl border border-white/8 text-slate-400 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">{notifications}</span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xs font-bold cursor-pointer">
              {username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5 pt-5">
          <AnimatePresence mode="wait">

            {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
            {activeSection === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Dashboard</h1>
                  <p className="text-slate-500 text-sm mt-0.5">Platform overview and key metrics</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                  {[
                    { icon: '📦', label: 'Total Listings',    value: items.length,      trend: '12%',  trendUp: true,  spark: SPARKS.listings,   color: '#00d4ff', border: 'border-cyan-500/20',   bg: 'from-cyan-500/10 to-blue-500/10'    },
                    { icon: '👥', label: 'Active Users',       value: users.length, trend: '8%', trendUp: true, spark: SPARKS.users, color: '#a78bfa', border: 'border-violet-500/20', bg: 'from-violet-500/10 to-purple-500/10' },
                    { icon: '🔍', label: 'Searches Today',    value: '2,847',           trend: '24%',  trendUp: true,  spark: SPARKS.searches,   color: '#00ff88', border: 'border-green-500/20',  bg: 'from-green-500/10 to-emerald-500/10'},
                    { icon: '💰', label: 'Avg Price',         value: `₹${avgPrice.toLocaleString('en-IN')}`, trend: '5%', trendUp: true, spark: SPARKS.revenue, color: '#f59e0b', border: 'border-amber-500/20', bg: 'from-amber-500/10 to-orange-500/10' },
                    { icon: '⏳', label: 'Pending Approvals', value: 3,                 trend: '2',    trendUp: false, spark: SPARKS.approvals,  color: '#f472b6', border: 'border-pink-500/20',   bg: 'from-pink-500/10 to-rose-500/10'    },
                    { icon: '🚩', label: 'Reported',          value: 1,                 trend: '0%',   trendUp: true,  spark: SPARKS.reported,   color: '#ef4444', border: 'border-red-500/20',    bg: 'from-red-500/10 to-rose-500/10'     },
                  ].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <KpiCard {...k} />
                    </motion.div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                  {/* Listing Growth */}
                  <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold text-sm">Listing Growth</h3>
                        <p className="text-slate-500 text-xs">Monthly new listings this year</p>
                      </div>
                      <span className="text-xs text-green-400 bg-green-500/15 px-2 py-1 rounded-full">↑ 18% YoY</span>
                    </div>
                    <BarChart data={[8,12,10,18,14,22,19,28,24,32,28,35]} color="#00d4ff" />
                  </div>

                  {/* Category Distribution */}
                  <div className="glass rounded-2xl p-5 border border-white/6">
                    <h3 className="text-white font-semibold text-sm mb-1">Category Split</h3>
                    <p className="text-slate-500 text-xs mb-4">Listings by category</p>
                    {catBreakdown.length > 0
                      ? <DonutChart segments={catBreakdown} />
                      : <p className="text-slate-500 text-xs text-center py-8">Loading...</p>
                    }
                  </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Search Trend */}
                  <div className="glass rounded-2xl p-5 border border-white/6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold text-sm">Search Trends</h3>
                        <p className="text-slate-500 text-xs">Daily search volume</p>
                      </div>
                    </div>
                    <BarChart data={[120,145,132,178,156,195,172,215,198,242,228,267]} color="#a78bfa" />
                  </div>

                  {/* Recent Activity */}
                  <div className="glass rounded-2xl p-5 border border-white/6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
                      <button onClick={() => setActiveSection('activity')} className="text-xs text-cyan-400 hover:text-cyan-300">View all →</button>
                    </div>
                    <div className="space-y-2.5">
                      {MOCK_ACTIVITY.slice(0, 5).map((a, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-3">
                          <span className="text-base flex-shrink-0">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${a.color} truncate`}>{a.msg}</p>
                            <p className="text-xs text-slate-600">{a.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ LISTINGS ═══════════════════════════════════════════════════ */}
            {activeSection === 'listings' && (
              <motion.div key="listings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-white">Listings</h1>
                    <p className="text-slate-500 text-sm">{items.length} total listings</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddItem(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold shadow-lg shadow-cyan-500/20">
                    + Add Listing
                  </motion.button>
                </div>

                {/* Filters bar */}
                <div className="glass rounded-2xl p-4 border border-white/6 mb-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="Search listings..."
                        className="w-full bg-transparent rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-cyan-500/35 transition-all" />
                    </div>
                    <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
                      className="bg-transparent rounded-xl px-4 py-2 text-sm text-slate-300 border border-white/8 focus:outline-none focus:border-cyan-500/35 transition-all">
                      <option value="" className="bg-dark-800">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.name} className="bg-dark-800">{c.name}</option>)}
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="bg-transparent rounded-xl px-4 py-2 text-sm text-slate-300 border border-white/8 focus:outline-none focus:border-cyan-500/35 transition-all">
                      <option value="title"    className="bg-dark-800">Sort: Title</option>
                      <option value="price"    className="bg-dark-800">Sort: Price</option>
                      <option value="category" className="bg-dark-800">Sort: Category</option>
                    </select>
                    {selectedIds.length > 0 && (
                      <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/25 transition-all">
                        🗑️ Delete {selectedIds.length}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="glass rounded-2xl border border-white/6 overflow-hidden mb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/6">
                          <th className="px-4 py-3 text-left">
                            <input type="checkbox"
                              checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                              onChange={toggleAll}
                              className="rounded accent-cyan-500" />
                          </th>
                          {[['title','Title'],['category','Category'],['price','Price']].map(([col, lbl]) => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                              onClick={() => toggleSort(col)}>
                              <span className="flex items-center gap-1">
                                {lbl}
                                {sortBy === col && <span className="text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                              </span>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedItems.length === 0 && (
                          <tr><td colSpan={6} className="text-center text-slate-500 py-12">No listings found</td></tr>
                        )}
                        {pagedItems.map((item, i) => {
                          const cat  = item.category?.name || 'Uncategorized';
                          const icon = CAT_ICONS[cat] || '📦';
                          const clr  = CAT_COLORS[cat] || '#64748b';
                          return (
                            <motion.tr key={item.id}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              className={`border-b border-white/4 hover:bg-white/3 transition-all group ${selectedIds.includes(item.id) ? 'bg-cyan-500/5' : ''}`}>
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded accent-cyan-500" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                    style={{ background: `${clr}15`, border: `1px solid ${clr}25` }}>
                                    {icon}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium text-sm line-clamp-1 max-w-48">{item.title}</p>
                                    <p className="text-slate-500 text-xs line-clamp-1 max-w-48">{item.description || '—'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                  style={{ background: `${clr}18`, color: clr, border: `1px solid ${clr}35` }}>
                                  {cat}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white font-semibold">
                                ₹{item.price?.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">Active</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    className="p-1.5 glass rounded-lg border border-white/8 text-slate-400 hover:text-white transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1.5 glass rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/15 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
                    </p>
                    <div className="flex gap-1">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 glass rounded-lg text-xs text-slate-400 border border-white/8 hover:text-white disabled:opacity-30 transition-all">← Prev</button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${page === i + 1 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'glass text-slate-400 border-white/8 hover:text-white'}`}>
                          {i + 1}
                        </button>
                      ))}
                      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 glass rounded-lg text-xs text-slate-400 border border-white/8 hover:text-white disabled:opacity-30 transition-all">Next →</button>
                    </div>
                  </div>
                )}

                {itemError && <p className="text-red-400 text-xs mt-3">⚠️ {itemError}</p>}
              </motion.div>
            )}

            {/* ══ CATEGORIES ═════════════════════════════════════════════════ */}
            {activeSection === 'categories' && (
              <motion.div key="categories" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-white">Categories</h1>
                    <p className="text-slate-500 text-sm">{categories.length} categories configured</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddCat(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-white text-sm font-semibold shadow-lg shadow-violet-500/20">
                    + Add Category
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {categories.map((cat, i) => {
                    const count = items.filter(item => item.category?.id === cat.id).length;
                    const color = CAT_COLORS[cat.name] || '#64748b';
                    const icon  = CAT_ICONS[cat.name]  || '📦';
                    return (
                      <motion.div key={cat.id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.25 } }}
                        className="glass rounded-2xl p-5 border border-white/6 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-8 translate-x-8"
                          style={{ backgroundColor: color }} />
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                            {icon}
                          </div>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 glass rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all opacity-0 group-hover:opacity-100">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                        <p className="text-white font-bold text-base mb-0.5">{cat.name}</p>
                        <p className="text-slate-500 text-xs mb-3">{cat.description || 'No description'}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black" style={{ color }}>{count}</span>
                          <span className="text-xs text-slate-500">active listings</span>
                        </div>
                        <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((count / Math.max(items.length, 1)) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full" style={{ backgroundColor: color }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {catError && <p className="text-red-400 text-xs">⚠️ {catError}</p>}
              </motion.div>
            )}

            {/* ══ USERS ══════════════════════════════════════════════════════ */}
            {activeSection === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Users</h1>
                  <p className="text-slate-500 text-sm">{users.length} registered users</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Users', value: users.length,                                      icon: '👥', color: 'border-cyan-500/20',   bg: 'from-cyan-500/10 to-blue-500/10'    },
                    { label: 'Users',       value: users.filter(u=>u.role==='USER').length,           icon: '✅', color: 'border-green-500/20',  bg: 'from-green-500/10 to-emerald-500/10'},
                    { label: 'Admins',      value: users.filter(u=>u.role==='ADMIN').length,          icon: '⚡', color: 'border-violet-500/20', bg: 'from-violet-500/10 to-purple-500/10'},
                    { label: 'This Month',  value: users.filter(u => { try { return new Date(u.createdAt).getMonth() === new Date().getMonth(); } catch { return false; } }).length, icon: '📅', color: 'border-amber-500/20', bg: 'from-amber-500/10 to-orange-500/10'},
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`glass rounded-2xl p-5 border ${s.color} bg-gradient-to-br ${s.bg}`}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="text-2xl font-black text-white">{s.value}</div>
                      <div className="text-xs text-slate-500">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="glass rounded-2xl border border-white/6 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/6">
                        {['User','Email','Role','Joined','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                          className="border-b border-white/4 hover:bg-white/3 transition-all group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-white font-medium text-sm">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25' : 'bg-white/8 text-slate-400 border border-white/10'}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={async () => { if (window.confirm(`Delete user "${u.username}"?`)) { try { await deleteUser(u.id); loadUsers(); } catch {} } }}
                                className="px-3 py-1 rounded-lg text-xs border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all">
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ══ APPROVALS ══════════════════════════════════════════════════ */}
            {activeSection === 'approvals' && (
              <motion.div key="approvals" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Approval Workflow</h1>
                  <p className="text-slate-500 text-sm">Review and moderate pending submissions</p>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'iPhone 15 Pro Max', cat: 'Electronics', user: 'arjun@example.com', time: '2h ago', priority: 'High',   type: 'Listing'  },
                    { title: 'TechZone Store',    cat: 'Business',    user: 'vikram@example.com', time: '4h ago', priority: 'Medium', type: 'Business' },
                    { title: 'Fake Rolex Watch',  cat: 'Clothing',    user: 'anon@example.com',   time: '6h ago', priority: 'High',   type: 'Reported' },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="glass rounded-2xl p-5 border border-white/6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.priority === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'}`}>
                          {item.priority}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{item.title}</p>
                          <p className="text-slate-500 text-xs">{item.type} · {item.cat} · by {item.user} · {item.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/25 transition-all">
                          ✓ Approve
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/25 transition-all">
                          ✕ Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ ANALYTICS ══════════════════════════════════════════════════ */}
            {activeSection === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Analytics</h1>
                  <p className="text-slate-500 text-sm">Platform performance and search insights</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  <div className="glass rounded-2xl p-6 border border-white/6">
                    <h3 className="text-white font-semibold mb-1">Search Volume</h3>
                    <p className="text-slate-500 text-xs mb-5">Daily searches over the last 12 months</p>
                    <BarChart data={[120,145,132,178,156,195,172,215,198,242,228,267]} color="#00d4ff" />
                  </div>
                  <div className="glass rounded-2xl p-6 border border-white/6">
                    <h3 className="text-white font-semibold mb-1">Listing Growth</h3>
                    <p className="text-slate-500 text-xs mb-5">New listings added per month</p>
                    <BarChart data={[8,12,10,18,14,22,19,28,24,32,28,35]} color="#a78bfa" />
                  </div>
                  <div className="glass rounded-2xl p-6 border border-white/6">
                    <h3 className="text-white font-semibold mb-1">User Growth</h3>
                    <p className="text-slate-500 text-xs mb-5">New user registrations per month</p>
                    <BarChart data={[5,8,7,12,10,15,13,18,16,22,20,25]} color="#00ff88" />
                  </div>
                  <div className="glass rounded-2xl p-6 border border-white/6">
                    <h3 className="text-white font-semibold mb-4">Category Distribution</h3>
                    {catBreakdown.length > 0 ? <DonutChart segments={catBreakdown} /> : <p className="text-slate-500 text-xs">Loading...</p>}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6 border border-white/6">
                  <h3 className="text-white font-semibold mb-1">Revenue Trend</h3>
                  <p className="text-slate-500 text-xs mb-5">Monthly platform revenue (mock data)</p>
                  <BarChart data={[42,55,48,72,63,88,76,95,85,108,98,120]} color="#f59e0b" />
                </div>
              </motion.div>
            )}

            {/* ══ ACTIVITY ═══════════════════════════════════════════════════ */}
            {activeSection === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Activity Feed</h1>
                  <p className="text-slate-500 text-sm">Live platform activity log</p>
                </div>
                <div className="glass rounded-2xl border border-white/6 divide-y divide-white/5">
                  {MOCK_ACTIVITY.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-all">
                      <div className="w-9 h-9 rounded-xl glass border border-white/8 flex items-center justify-center text-base flex-shrink-0">{a.icon}</div>
                      <div className="flex-1">
                        <p className={`text-sm ${a.color}`}>{a.msg}</p>
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">{a.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ HEALTH ═════════════════════════════════════════════════════ */}
            {activeSection === 'health' && (
              <motion.div key="health" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-white">Platform Health</h1>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/15 border border-green-500/25 text-green-400 rounded-full text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> All Systems Operational
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">Live monitoring of platform infrastructure</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {HEALTH_METRICS.map((m, i) => (
                    <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                      className="glass rounded-2xl p-5 border border-white/6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{m.icon}</span>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${m.bar}`} />
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">{m.label}</p>
                      <p className={`text-xs font-medium mb-2 ${m.color}`}>{m.status}</p>
                      <p className="text-slate-500 text-xs">Response: {m.ms}</p>
                      <div className="mt-3 h-1 rounded-full bg-white/8">
                        <motion.div initial={{ width: 0 }} animate={{ width: '92%' }}
                          transition={{ duration: 1.2, delay: i * 0.1 }}
                          className={`h-full rounded-full ${m.bar} opacity-60`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="glass rounded-2xl p-6 border border-white/6">
                  <h3 className="text-white font-semibold mb-4">System Uptime (Last 30 Days)</h3>
                  <div className="flex gap-1">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className={`flex-1 h-8 rounded-sm ${i === 12 ? 'bg-amber-400/60' : 'bg-green-400/60'}`}
                        title={i === 12 ? 'Minor incident' : 'Operational'} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>30 days ago</span>
                    <span className="text-green-400 font-semibold">99.97% uptime</span>
                    <span>Today</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ SETTINGS ═══════════════════════════════════════════════════ */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white">Settings</h1>
                  <p className="text-slate-500 text-sm">Platform configuration and preferences</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {[
                    { title: 'Platform Info',    desc: 'Name, description, contact email',  icon: '⚡' },
                    { title: 'Security',         desc: 'Auth settings, JWT expiry, 2FA',     icon: '🔐' },
                    { title: 'Notifications',    desc: 'Email alerts and webhook settings',  icon: '🔔' },
                    { title: 'API Access',       desc: 'API keys, rate limits, CORS',        icon: '🔌' },
                    { title: 'Data & Storage',   desc: 'Backups, exports, retention policy', icon: '💾' },
                    { title: 'Appearance',       desc: 'Theme, branding, custom domain',     icon: '🎨' },
                  ].map((s, i) => (
                    <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -3, transition: { duration: 0.25 } }}
                      className="glass rounded-2xl p-5 border border-white/6 cursor-pointer hover:border-white/14 transition-all flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl glass border border-white/8 flex items-center justify-center text-2xl flex-shrink-0">{s.icon}</div>
                      <div>
                        <p className="text-white font-semibold text-sm">{s.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-600 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ SEARCH LOGS ════════════════════════════════════════════════ */}
            {activeSection === 'searchlogs' && (
              <motion.div key="searchlogs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-white">Search Logs</h1>
                    <p className="text-slate-500 text-sm">{searchLogs.length} recent searches</p>
                  </div>
                  <button onClick={loadSearchLogs} className="px-4 py-2 glass rounded-xl text-xs text-slate-400 border border-white/8 hover:text-white transition-all">↻ Refresh</button>
                </div>
                {analytics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Searches', value: analytics.totalSearches,   icon: '🔍', color: 'border-cyan-500/20',   bg: 'from-cyan-500/10 to-blue-500/10'    },
                      { label: 'Listings',        value: analytics.totalListings,   icon: '📦', color: 'border-violet-500/20', bg: 'from-violet-500/10 to-purple-500/10'},
                      { label: 'Reviews',         value: analytics.totalReviews,    icon: '⭐', color: 'border-amber-500/20',  bg: 'from-amber-500/10 to-orange-500/10' },
                      { label: 'Saved Items',     value: analytics.totalSavedItems, icon: '❤️', color: 'border-pink-500/20',   bg: 'from-pink-500/10 to-rose-500/10'    },
                    ].map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className={`glass rounded-2xl p-5 border ${s.color} bg-gradient-to-br ${s.bg}`}>
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="text-2xl font-black text-white">{s.value}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="glass rounded-2xl border border-white/6 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/6">
                        {['Keyword','User','Results','Time','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {searchLogs.map((log, i) => (
                        <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="border-b border-white/4 hover:bg-white/3 transition-all group">
                          <td className="px-4 py-3 text-white font-medium">{log.keyword}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{log.username}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded-lg text-xs border border-cyan-500/20">{log.results}</span></td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{new Date(log.searched_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                          <td className="px-4 py-3">
                            <button onClick={async () => { try { await deleteSearchLog(log.id); loadSearchLogs(); } catch {} }}
                              className="px-3 py-1 opacity-0 group-hover:opacity-100 rounded-lg text-xs border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all">
                              Delete
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                      {searchLogs.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No search logs yet — searches will appear here automatically</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── SLIDE-OVER: ADD LISTING ────────────────────────────────────────── */}
      <SlideOver open={showAddItem} onClose={() => { setShowAddItem(false); setItemError(''); }} title="Add New Listing">
        {itemError && <div className="glass rounded-xl px-4 py-3 border border-red-500/20 text-red-400 text-sm mb-4">⚠️ {itemError}</div>}
        <form onSubmit={handleAddItem} className="space-y-4">
          {[
            { label: 'Title',       field: 'title',       type: 'text',   ph: 'e.g. iPhone 15 Pro',       req: true  },
            { label: 'Description', field: 'description', type: 'text',   ph: 'Brief description...',     req: false },
            { label: 'Price (₹)',   field: 'price',       type: 'number', ph: 'e.g. 25000',               req: true  },
          ].map(({ label, field, type, ph, req }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type} placeholder={ph} required={req} min={type === 'number' ? '0' : undefined}
                value={field === 'price' ? itemForm.price : field === 'title' ? itemForm.title : itemForm.description}
                onChange={e => setItemForm(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-cyan-500/40 transition-all bg-transparent" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
          <select value={itemForm.categoryId} onChange={e => setItemForm(p => ({ ...p, categoryId: e.target.value }))}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-300 border border-white/8 focus:outline-none focus:border-cyan-500/40 bg-transparent">
              <option value="" className="bg-dark-800">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id} className="bg-dark-800">{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <select value={itemForm.status} onChange={e => setItemForm(p => ({ ...p, status: e.target.value }))}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-300 border border-white/8 focus:outline-none focus:border-cyan-500/40 bg-transparent">
              <option className="bg-dark-800">Active</option>
              <option className="bg-dark-800">Draft</option>
              <option className="bg-dark-800">Pending Review</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddItem(false)}
              className="flex-1 py-3 glass rounded-xl text-sm text-slate-400 border border-white/8 hover:text-white transition-all">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold shadow-lg shadow-cyan-500/20">
              Add Listing
            </motion.button>
          </div>
        </form>
      </SlideOver>

      {/* ── SLIDE-OVER: ADD CATEGORY ───────────────────────────────────────── */}
      <SlideOver open={showAddCat} onClose={() => { setShowAddCat(false); setCatError(''); }} title="Add New Category">
        {catError && <div className="glass rounded-xl px-4 py-3 border border-red-500/20 text-red-400 text-sm mb-4">⚠️ {catError}</div>}
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
            <input required value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Electronics"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-violet-500/40 transition-all bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..."
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 border border-white/8 focus:outline-none focus:border-violet-500/40 transition-all bg-transparent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddCat(false)}
              className="flex-1 py-3 glass rounded-xl text-sm text-slate-400 border border-white/8 hover:text-white transition-all">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-white text-sm font-semibold shadow-lg shadow-violet-500/20">
              Add Category
            </motion.button>
          </div>
        </form>
      </SlideOver>

    </div>
  );
}

export default AdminDashboard;
