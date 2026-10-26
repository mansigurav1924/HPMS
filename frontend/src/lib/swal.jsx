import React from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Minimal, dependency-free replacement for the subset of SweetAlert2 used in this app.
 * Supports: title, text, html, icon, confirmButtonText, cancelButtonText,
 * showCancelButton, timer. Resolves to { isConfirmed, isDismissed }.
 */
const ICONS = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-500 bg-emerald-50' },
  error: { Icon: AlertCircle, cls: 'text-red-500 bg-red-50' },
  warning: { Icon: AlertTriangle, cls: 'text-amber-500 bg-amber-50' },
  info: { Icon: Info, cls: 'text-primary-500 bg-primary-50' },
  question: { Icon: Info, cls: 'text-primary-500 bg-primary-50' },
};

function Dialog({ opts, onClose }) {
  const [open, setOpen] = React.useState(true);
  const meta = opts.icon ? ICONS[opts.icon] : null;

  const close = (isConfirmed) => {
    setOpen(false);
    setTimeout(() => onClose({ isConfirmed, isDismissed: !isConfirmed }), 160);
  };

  React.useEffect(() => {
    if (opts.timer) {
      const t = setTimeout(() => close(false), opts.timer);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-brand-navy/50 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white rounded-3xl shadow-float p-7 w-full max-w-md text-center"
          >
            {meta && (
              <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center ${meta.cls}`}>
                <meta.Icon size={28} />
              </div>
            )}
            {opts.title && <h2 className="text-xl font-bold text-brand-navy mb-2">{opts.title}</h2>}
            {opts.html ? (
              <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: opts.html }} />
            ) : (
              opts.text && <p className="text-sm text-gray-600 leading-relaxed">{opts.text}</p>
            )}
            {!opts.timer && (
              <div className="mt-6 flex gap-3 justify-center">
                {opts.showCancelButton && (
                  <button className="btn-secondary" onClick={() => close(false)}>
                    {opts.cancelButtonText || 'Cancel'}
                  </button>
                )}
                <button className="btn-cta !py-2.5" onClick={() => close(true)} autoFocus>
                  {opts.confirmButtonText || 'OK'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const Swal = {
  fire(options = {}) {
    return new Promise((resolve) => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);
      const onClose = (result) => {
        root.unmount();
        host.remove();
        resolve(result);
      };
      root.render(<Dialog opts={options} onClose={onClose} />);
    });
  },
};

export default Swal;
