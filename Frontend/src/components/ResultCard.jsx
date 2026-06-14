import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  Electronics: { bg: 'from-cyan-500/10 to-blue-500/10',    border: 'border-cyan-500/20',   badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'    },
  Books:       { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  Clothing:    { bg: 'from-pink-500/10 to-rose-500/10',     border: 'border-pink-500/20',   badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30'      },
  Furniture:   { bg: 'from-amber-500/10 to-orange-500/10',  border: 'border-amber-500/20',  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'   },
};

const CATEGORY_ICONS = {
  Electronics: '💻',
  Books:       '📚',
  Clothing:    '👕',
  Furniture:   '🪑',
};

function ResultCard({ item, index = 0 }) {
  const catName = item.category?.name || 'Other';
  const colors  = CATEGORY_COLORS[catName] || {
    bg: 'from-slate-500/10 to-slate-600/10',
    border: 'border-slate-500/20',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
      className={`group relative glass rounded-2xl p-5 border ${colors.border} bg-gradient-to-br ${colors.bg} cursor-pointer overflow-hidden`}
      style={{ boxShadow: 'none', transition: 'box-shadow 0.4s ease' }}
    >
      {/* Hover shimmer overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_ICONS[catName] || '📦'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors.badge}`}>
            {catName}
          </span>
        </div>
        <p className="text-lg font-bold text-white whitespace-nowrap">
          ₹{item.price?.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-cyan-100 transition-colors duration-300 line-clamp-1">
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
        {item.description || 'No description available.'}
      </p>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-colors duration-300 ${i < 4 ? 'bg-cyan-400' : 'bg-white/10'}`} />
          ))}
        </div>
        <motion.span
          whileHover={{ x: 3, transition: { duration: 0.25 } }}
          className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors duration-300 flex items-center gap-1 cursor-pointer"
        >
          View
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.span>
      </div>
    </motion.div>
  );
}

export default ResultCard;
