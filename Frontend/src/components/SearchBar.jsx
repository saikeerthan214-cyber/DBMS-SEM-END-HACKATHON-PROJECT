import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'Laptop', 'Smartphone', 'Headphones', 'Office Chair',
  'Java Programming', 'Data Structures', 'T-Shirt', 'Study Table',
];

function SearchBar({ keyword, setKeyword, onSearch }) {
  const [focused,     setFocused]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (keyword.trim().length > 0) {
      const filtered = SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(keyword.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [keyword]);

  const handleSelect = (val) => {
    setKeyword(val);
    setSuggestions([]);
    onSearch(val);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { setSuggestions([]); onSearch(); }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <motion.div
        animate={focused
          ? { scale: 1.015, boxShadow: '0 0 0 1px rgba(0,212,255,0.35), 0 0 40px rgba(0,212,255,0.12)' }
          : { scale: 1,     boxShadow: '0 0 0 0px rgba(0,212,255,0)' }
        }
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="glass-strong rounded-2xl border border-white/8"
      >
        <div className="flex items-center px-5 py-4 gap-4">
          {/* Icon */}
          <motion.div
            animate={{ color: focused ? '#00d4ff' : '#64748b' }}
            transition={{ duration: 0.4 }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            placeholder="Search items, categories, products..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
            aria-label="Search"
          />

          {/* Clear */}
          <AnimatePresence>
            {keyword && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
                onClick={() => { setKeyword(''); onSearch(''); }}
                className="text-slate-500 hover:text-slate-300 transition-colors duration-300 p-1"
                aria-label="Clear"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Search button */}
          <motion.button
            whileHover={{ scale: 1.06, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.94, transition: { duration: 0.1 } }}
            onClick={() => onSearch()}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-shadow duration-400 flex-shrink-0"
          >
            Search
          </motion.button>
        </div>
      </motion.div>

      {/* Autocomplete */}
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0,    y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-50 border border-white/8"
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-250 text-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
