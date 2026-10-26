import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

/**
 * Lightweight, dependency-free toast system.
 * Usage (anywhere, no hook needed):  toast.success('Saved'), toast.error('Oops')
 * Mount <Toaster /> once near the app root.
 */
let listeners = [];
let items = [];
let counter = 0;

const emit = () => listeners.forEach((l) => l([...items]));

const dismiss = (id) => {
  items = items.filter((t) => t.id !== id);
  emit();
};

const push = (type, message, opts = {}) => {
  const id = ++counter;
  items = [...items, { id, type, message, title: opts.title }].slice(-4);
  emit();
  setTimeout(() => dismiss(id), opts.duration ?? 4000);
  return id;
};

export const toast = {
  success: (m, o) => push('success', m, o),
  error: (m, o) => push('error', m, { duration: 5500, ...o }),
  info: (m, o) => push('info', m, o),
  warning: (m, o) => push('warning', m, o),
  dismiss,
};

const STYLES = {
  success: { icon: CheckCircle2, ring: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, ring: 'text-red-500', bar: 'bg-red-500' },
  info: { icon: Info, ring: 'text-primary-500', bar: 'bg-primary-500' },
  warning: { icon: AlertTriangle, ring: 'text-amber-500', bar: 'bg-amber-500' },
};

export function Toaster() {
  const [list, setList] = useState([]);

  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((l) => l !== setList);
    };
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto relative overflow-hidden flex items-start gap-3 bg-white rounded-2xl shadow-float border border-gray-100 p-4 pr-10"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />
              <Icon size={20} className={`${s.ring} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                {t.title && <p className="text-sm font-bold text-brand-navy">{t.title}</p>}
                <p className="text-sm text-gray-600 break-words">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
