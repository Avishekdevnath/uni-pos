import { useState, useMemo, useRef, useEffect } from 'react';

// ── Emoji catalogue (8 retail categories, ~180 emojis) ───────────────────────

const EMOJI_GROUPS: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Beverages',
    icon: '🥤',
    emojis: ['💧','🥤','🧃','🍵','☕','🧋','🍺','🥂','🍷','🍸','🍹','🧊','🍶','🧉','🫖','🥛','🍾','🥃'],
  },
  {
    label: 'Food',
    icon: '🍎',
    emojis: ['🍎','🍊','🍋','🍇','🍓','🥝','🍑','🥭','🍌','🍍','🥦','🥕','🍅','🥑','🌽','🧅','🥔','🍆','🧄','🫑','🥬','🫛','🍄','🌶️','🥒','🫒','🧀','🥚','🥩','🍗','🥓','🌮','🍔','🌯','🍜','🍛','🥗','🍕','🍝','🥫','🫙'],
  },
  {
    label: 'Bakery & Sweets',
    icon: '🍞',
    emojis: ['🍞','🥐','🥖','🥨','🧁','🍰','🎂','🥧','🍩','🍪','🍫','🍬','🍭','🍮','🍯','🧇','🥞','🧆','🍡','🍧','🍨','🍦','🍿'],
  },
  {
    label: 'Personal Care',
    icon: '🧴',
    emojis: ['🧴','🧼','🪥','🧻','🪒','🧹','💊','💉','🩺','🩹','🧽','🪣','🪤','💄','💅','🧖','🪞','🧸'],
  },
  {
    label: 'Household',
    icon: '🏠',
    emojis: ['🏠','🪑','🛋️','🛏️','🚿','🛁','🚽','🔧','🪛','🔨','🔑','🪴','🕯️','💡','🔌','🧯','🗑️','📦','🪜'],
  },
  {
    label: 'Electronics',
    icon: '📱',
    emojis: ['📱','💻','🖥️','⌨️','🖱️','🖨️','📷','📸','🎮','🕹️','📺','📻','🔋','🔌','💾','💿','📡','⌚','🎧','🎙️'],
  },
  {
    label: 'Stationery',
    icon: '📝',
    emojis: ['📝','✏️','🖊️','🖋️','📏','📐','📌','📎','🗂️','📁','📂','📓','📔','📒','📕','📗','📘','📙','📚','🗒️','🗃️','✂️','🖇️'],
  },
  {
    label: 'Other',
    icon: '📦',
    emojis: ['📦','🎁','🛒','💰','💵','💳','🏷️','🧲','🪙','⭐','✨','🔥','💎','🎯','🎪','🎨','🧩','🎲','🃏','🎴'],
  },
];

const ALL_EMOJIS = EMOJI_GROUPS.flatMap((g) => g.emojis);

// ── Component ────────────────────────────────────────────────────────────────

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ value, onChange, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Auto-focus search
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const displayed = useMemo(() => {
    if (search.trim()) return ALL_EMOJIS;
    return EMOJI_GROUPS[activeGroup].emojis;
  }, [search, activeGroup]);

  return (
    <div
      ref={containerRef}
      className="absolute z-50 rounded-xl shadow-2xl overflow-hidden"
      style={{
        width: 300,
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
        >
          <span className="text-text3 text-sm">🔍</span>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis…"
            className="flex-1 bg-transparent border-none outline-none text-text1 text-[13px] placeholder:text-text3"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-text3 hover:text-text1 text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Group tabs */}
      {!search && (
        <div className="flex px-2 pb-1 gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_GROUPS.map((g, i) => (
            <button
              key={i}
              onClick={() => setActiveGroup(i)}
              title={g.label}
              className="flex-shrink-0 w-8 h-8 rounded-lg text-[16px] flex items-center justify-center transition-all"
              style={
                i === activeGroup
                  ? { background: 'var(--accent-dim)', border: '1px solid var(--accent)' }
                  : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              {g.icon}
            </button>
          ))}
        </div>
      )}

      {/* Group label */}
      {!search && (
        <div className="px-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[.08em] text-text3">
            {EMOJI_GROUPS[activeGroup].label}
          </span>
        </div>
      )}

      {/* Emoji grid */}
      <div className="overflow-y-auto px-2 pb-3" style={{ maxHeight: 200 }}>
        <div className="grid grid-cols-8 gap-0.5">
          {displayed.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onChange(emoji); onClose(); }}
              className="w-8 h-8 rounded-lg text-[18px] flex items-center justify-center transition-all hover:scale-110"
              style={
                emoji === value
                  ? { background: 'var(--accent-dim)', border: '1px solid var(--accent)' }
                  : { background: 'transparent' }
              }
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          {displayed.length === 0 && (
            <div className="col-span-8 py-4 text-center text-text3 text-xs">No emojis found</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trigger button (reusable) ────────────────────────────────────────────────

interface EmojiButtonProps {
  value: string | null;
  onChange: (emoji: string) => void;
  size?: number;
}

export function EmojiButton({ value, onChange, size = 48 }: EmojiButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl flex items-center justify-center transition-all hover:scale-105"
        style={{
          width: size, height: size,
          fontSize: size * 0.55,
          background: 'var(--surface2)',
          border: open ? '2px solid var(--accent)' : '2px solid var(--border2)',
        }}
        title="Choose emoji"
      >
        {value ?? '📦'}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1">
          <EmojiPicker
            value={value}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
