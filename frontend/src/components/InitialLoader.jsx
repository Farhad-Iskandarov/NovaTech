import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function InitialLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check theme immediately
    const savedTheme = localStorage.getItem('novatech-theme');
    setIsDark(savedTheme === 'dark');

    // Check if this is the first visit
    const hasLoaded = sessionStorage.getItem('novatech-loaded');

    if (hasLoaded) {
      // Already loaded before, hide immediately
      setIsVisible(false);
    } else {
      // First visit - show loader then hide after 2.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('novatech-loaded', 'true');
      }, 2500);

      return () => clearTimeout(timer);
    }

    setHasChecked(true);
  }, []);

  // Don't render at all if already loaded (returning null immediately after check)
  if (!isVisible && hasChecked) return null;
  if (!isVisible) return null;

  // Define colors based on theme
  const bgColor = isDark
    ? 'linear-gradient(to bottom right, #020617, #0f172a, #020617)'
    : 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardShadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(148, 163, 184, 0.25)';
  const barBg = isDark ? '#334155' : '#e2e8f0';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      data-testid="initial-loader"
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
        background: bgColor
      }}
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(91, 91, 247, 0.2)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(0, 201, 167, 0.2)' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center gap-6 sm:gap-8">
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: cardBg,
              boxShadow: cardShadow
            }}
          >
            <img
              src="/logo.jpg"
              alt="Novatech"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </motion.div>

          {/* Animated Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="absolute -inset-2 rounded-3xl"
            style={{ border: '2px solid rgba(91, 91, 247, 0.3)' }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-[1.5rem]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, #5B5BF7 10%, transparent 20%)'
            }}
          />
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: textColor }}
          >
            <span style={{ color: '#5B5BF7' }}>Nova</span>tech
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-sm mt-1"
            style={{ color: subtextColor }}
          >
            Education Center
          </motion.p>
        </motion.div>

        {/* Loading Bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '120px' }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: barBg }}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="h-full w-1/2"
            style={{ background: 'linear-gradient(to right, transparent, #5B5BF7, transparent)' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
