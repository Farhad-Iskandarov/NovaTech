import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Master passwords for recovery
const MASTER_PASSWORD_2 = 'Asif.?Yek.?NZS.?Baku69!';
const MASTER_PASSWORD_3 = 'Farhad.?Yek.?NZS.?Polsa69!';
const FAILED_ATTEMPTS_KEY = 'admin-failed-attempts';
const MASTER_ATTEMPTS_KEY = 'admin-master-attempts';
const LOCKOUT_TIMESTAMP_KEY = 'admin-lockout-timestamp';
const FAILED_ATTEMPTS_THRESHOLD = 10;
const MASTER_ATTEMPTS_THRESHOLD = 3;
const LOCKOUT_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [masterAttempts, setMasterAttempts] = useState(0);
  const [showMasterPasswords, setShowMasterPasswords] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    masterPassword2: '',
    masterPassword3: ''
  });

  useEffect(() => {
    // Fetch security setting from backend
    const fetchSecuritySetting = async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        setSecurityEnabled(res.data.admin_security_enabled !== false);
      } catch (error) {
        // If error, assume security is enabled for safety
        setSecurityEnabled(true);
      }
    };
    fetchSecuritySetting();

    // Check lockout status
    const lockoutTimestamp = localStorage.getItem(LOCKOUT_TIMESTAMP_KEY);
    if (lockoutTimestamp) {
      const lockoutEnd = parseInt(lockoutTimestamp, 10);
      const now = Date.now();

      if (now < lockoutEnd) {
        setIsLockedOut(true);
        setLockoutTimeRemaining(lockoutEnd - now);
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }

    // Load failed attempts from localStorage
    const stored = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    const attempts = stored ? parseInt(stored, 10) : 0;
    setFailedAttempts(attempts);
    setShowMasterPasswords(attempts >= FAILED_ATTEMPTS_THRESHOLD);

    // Load master password attempts
    const masterStored = localStorage.getItem(MASTER_ATTEMPTS_KEY);
    const masterAttemptCount = masterStored ? parseInt(masterStored, 10) : 0;
    setMasterAttempts(masterAttemptCount);
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut) return;

    const interval = setInterval(() => {
      const lockoutTimestamp = localStorage.getItem(LOCKOUT_TIMESTAMP_KEY);
      if (lockoutTimestamp) {
        const lockoutEnd = parseInt(lockoutTimestamp, 10);
        const now = Date.now();
        const remaining = lockoutEnd - now;

        if (remaining <= 0) {
          // Lockout expired
          setIsLockedOut(false);
          setLockoutTimeRemaining(0);
          localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
          localStorage.removeItem(FAILED_ATTEMPTS_KEY);
          setFailedAttempts(0);
          setShowMasterPasswords(false);
          clearInterval(interval);
        } else {
          setLockoutTimeRemaining(remaining);
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isLockedOut]);

  const formatTimeRemaining = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const activateLockout = () => {
    const lockoutEnd = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, lockoutEnd.toString());
    setIsLockedOut(true);
    setLockoutTimeRemaining(LOCKOUT_DURATION);
  };

  const incrementFailedAttempts = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());

    if (newAttempts >= FAILED_ATTEMPTS_THRESHOLD) {
      setShowMasterPasswords(true);
    }
  };

  const incrementMasterAttempts = () => {
    const newAttempts = masterAttempts + 1;
    setMasterAttempts(newAttempts);
    localStorage.setItem(MASTER_ATTEMPTS_KEY, newAttempts.toString());
    return newAttempts;
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setMasterAttempts(0);
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(MASTER_ATTEMPTS_KEY);
    setShowMasterPasswords(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if security system is enabled
    if (!securityEnabled) {
      // Security disabled - simple login
      setError('');
      setLoading(true);
      try {
        const res = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password
        });

        localStorage.setItem('novatech-token', res.data.access_token);
        localStorage.setItem('novatech-user', JSON.stringify(res.data.user));
        navigate('/nova-admin/dashboard');
      } catch (err) {
        setError(err.response?.data?.detail || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Security enabled - apply all security measures

    // Check if locked out
    if (isLockedOut) {
      setError(`Admin panel is locked. Try again in ${formatTimeRemaining(lockoutTimeRemaining)}`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if master passwords are being used (recovery mode)
      if (showMasterPasswords && formData.masterPassword2 && formData.masterPassword3) {
        // Validate master passwords
        if (formData.masterPassword2 === MASTER_PASSWORD_2 &&
          formData.masterPassword3 === MASTER_PASSWORD_3) {
          // Master passwords are CORRECT - use master bypass endpoint
          try {
            const res = await axios.post(`${API}/auth/master-login`, {
              email: formData.email,
              master_password_1: formData.masterPassword2,
              master_password_2: formData.masterPassword3
            });

            localStorage.setItem('novatech-token', res.data.access_token);
            localStorage.setItem('novatech-user', JSON.stringify(res.data.user));
            resetFailedAttempts();
            localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
            toast.success('Successfully logged in with master passwords');
            navigate('/nova-admin/dashboard');
            return;
          } catch (loginErr) {
            if (loginErr.response?.status === 404) {
              setError('Master passwords correct, but the email does not exist in the system');
            } else if (loginErr.response?.status === 401) {
              // Master passwords incorrect on server side
              const newMasterAttempts = incrementMasterAttempts();
              const remainingMasterAttempts = MASTER_ATTEMPTS_THRESHOLD - newMasterAttempts;

              if (remainingMasterAttempts > 0) {
                setError(`Incorrect master passwords. ${remainingMasterAttempts} attempts remaining before 3-day lockout.`);
              } else {
                activateLockout();
                setError('Master passwords incorrect. Admin panel locked for 3 days.');
              }
            } else {
              setError(loginErr.response?.data?.detail || 'Login failed');
            }
            setLoading(false);
            return;
          }
        } else {
          // Master passwords are INCORRECT (client-side check)
          const newMasterAttempts = incrementMasterAttempts();
          const remainingMasterAttempts = MASTER_ATTEMPTS_THRESHOLD - newMasterAttempts;

          if (remainingMasterAttempts > 0) {
            setError(`Incorrect master passwords. ${remainingMasterAttempts} attempts remaining before 3-day lockout.`);
          } else {
            // ACTIVATE 3-DAY LOCKOUT after 3 failed master password attempts
            activateLockout();
            setError('Master passwords incorrect. Admin panel locked for 3 days.');
          }
          setLoading(false);
          return;
        }
      }

      // Normal login attempt (not using master passwords yet)
      const res = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('novatech-token', res.data.access_token);
      localStorage.setItem('novatech-user', JSON.stringify(res.data.user));
      resetFailedAttempts();
      localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
      navigate('/nova-admin/dashboard');
    } catch (err) {
      // Only increment failed attempts if NOT using master passwords
      if (!showMasterPasswords || !formData.masterPassword2 || !formData.masterPassword3) {
        incrementFailedAttempts();
        const remainingAttempts = FAILED_ATTEMPTS_THRESHOLD - failedAttempts - 1;

        if (remainingAttempts > 0 && remainingAttempts <= 5) {
          setError(`Invalid credentials. ${remainingAttempts} attempts remaining before recovery mode.`);
        } else if (remainingAttempts <= 0) {
          setError('Recovery mode activated. Use master passwords to access.');
        } else {
          setError(err.response?.data?.detail || 'Invalid credentials');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.jpg"
                alt="Novatech"
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1
              data-testid="admin-login-title"
              className="text-2xl font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Admin Login
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Lockout Screen */}
          {isLockedOut && securityEnabled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Admin Panel Locked
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Access has been blocked due to incorrect master passwords
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-300">Time Remaining</span>
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 font-mono">
                  {formatTimeRemaining(lockoutTimeRemaining)}
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>The admin panel will be accessible again after the timer expires.</p>
                <p>Please contact system administrator if this is urgent.</p>
              </div>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {showMasterPasswords && securityEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 p-4 mb-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg"
                >
                  <Shield className="w-5 h-5" />
                  <div className="text-sm">
                    <p className="font-semibold">Recovery Mode Activated</p>
                    <p className="text-xs mt-1">Enter master passwords to access admin panel</p>
                    <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-semibold">
                      ⚠️ You have {MASTER_ATTEMPTS_THRESHOLD - masterAttempts} attempts remaining
                    </p>
                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                      After {MASTER_ATTEMPTS_THRESHOLD} failed attempts, admin panel will be locked for 3 days
                    </p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      data-testid="admin-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@novatech.az"
                      className="pl-10 h-12 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="admin-password"
                      type="password"
                      data-testid="admin-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pl-10 h-12 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                      required={!showMasterPasswords}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {showMasterPasswords && securityEnabled && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-4 border-t border-amber-200 dark:border-amber-800"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="master-password-2" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Master Password 2
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                        <Input
                          id="master-password-2"
                          type="password"
                          data-testid="master-password-2"
                          value={formData.masterPassword2}
                          onChange={(e) => setFormData({ ...formData, masterPassword2: e.target.value })}
                          placeholder="Enter master password 2"
                          className="pl-10 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white border-amber-300 dark:border-amber-800"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="master-password-3" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Master Password 3
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                        <Input
                          id="master-password-3"
                          type="password"
                          data-testid="master-password-3"
                          value={formData.masterPassword3}
                          onChange={(e) => setFormData({ ...formData, masterPassword3: e.target.value })}
                          placeholder="Enter master password 3"
                          className="pl-10 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white border-amber-300 dark:border-amber-800"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  data-testid="admin-login-submit"
                  className="w-full bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full h-12 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
