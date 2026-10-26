import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export { Toaster, toast } from './toast';
export * from './data';
export { formatINR, formatDate, apiFetch } from '../../lib/api';

const BUTTON_VARIANTS = {
  cta: 'btn-cta',
  primary: 'btn-cta',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  'dark-circle': 'btn-dark-circle',
  'light-circle': 'btn-light-circle',
};

export const Button = ({ children, variant = 'cta', loading = false, disabled, className = '', ...props }) => {
  const base = BUTTON_VARIANTS[variant] || 'btn-light-circle';
  return (
    <button className={`${base} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ children, className = '', ...props }) => (
  <span className={`badge ${className}`} {...props}>
    {children}
  </span>
);

export const PillSelect = ({ className = '', ...props }) => (
  <select className={`pill-select ${className}`} {...props} />
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl ${className}`} aria-hidden="true" />
);

export const EmptyState = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    {icon && <div className="text-gray-400 mb-4 w-20 h-20 rounded-full bg-primary-50/60 flex items-center justify-center">{icon}</div>}
    <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md">{description}</p>
    {action}
  </div>
);

export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export const StaggerList = ({ children, className = '' }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: { staggerChildren: 0.05 }
      }
    }}
  >
    {React.Children.map(children, child => (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 }
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
);

export const Popover = ({ trigger, children, isOpen, onClose, align = 'left' }) => {
  const alignmentClass = align === 'right' ? 'right-0 origin-top-right' : 'origin-top-left';
  return (
    <div className="relative inline-block text-left">
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute z-50 mt-2 min-w-[14rem] rounded-2xl bg-white shadow-float ring-1 ring-black/5 overflow-hidden ${alignmentClass}`}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative bg-white rounded-3xl shadow-float p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {title && <h2 className="text-xl font-bold text-brand-navy mb-4">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
