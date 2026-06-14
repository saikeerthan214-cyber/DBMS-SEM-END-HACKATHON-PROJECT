import { motion } from 'framer-motion';

const CATEGORY_ICONS = {
  Electronics: '💻',
  Books:       '📚',
  Clothing:    '👕',
  Furniture:   '🪑',
};

const ease = [0.25, 0.1, 0.25, 1];

function FilterPanel({ categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange }) {
  const pct = (priceRange / 200000) * 100;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease }}
      className="w-full md:w-64 flex-shrink-0 space-y-4"
    >
      {/* Categories */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Categories
        </h3>

        {/* All */}
        <motion.button
          whileHover={{ scale: 1.02, x: 2, transition: { duration: 0.25 } }}
          whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
          onClick={() => setSelectedCategory('')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-350 mb-1 ${
            !selectedCategory
              ? 'bg-gradient-to-r from-cyan-500/20 to-violet-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-base">🌐</span>
          <span>All Categories</span>
          {!selectedCategory && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
            />
          )}
        </motion.button>

        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 + i * 0.07, ease }}
            whileHover={{ scale: 1.02, x: 2, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            onClick={() => setSelectedCategory(String(cat.id))}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-350 mb-1 ${
              selectedCategory === String(cat.id)
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">{CATEGORY_ICONS[cat.name] || '📦'}</span>
            <span>{cat.name}</span>
            {selectedCategory === String(cat.id) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Price Range */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease }}
        className="glass rounded-2xl p-5 border border-white/5"
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Max Price
        </h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 text-xs">₹0</span>
          <motion.span
            key={priceRange}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-cyan-300 font-semibold text-sm"
          >
            ₹{priceRange.toLocaleString('en-IN')}
          </motion.span>
          <span className="text-slate-500 text-xs">₹2L</span>
        </div>

        <div className="relative h-5 flex items-center">
          {/* Track */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full"
              style={{ width: `${pct}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          {/* Invisible range input */}
          <input
            type="range" min="0" max="200000" step="1000"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Max price"
          />
          {/* Thumb */}
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 pointer-events-none"
            style={{ left: `calc(${pct}% - 8px)` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </motion.div>

      {/* Reset */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease }}
        whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        onClick={() => { setSelectedCategory(''); setPriceRange(100000); }}
        className="w-full py-2.5 glass rounded-xl text-sm text-slate-400 hover:text-white border border-white/5 hover:border-white/15 transition-all duration-350"
      >
        Reset Filters
      </motion.button>
    </motion.aside>
  );
}

export default FilterPanel;
