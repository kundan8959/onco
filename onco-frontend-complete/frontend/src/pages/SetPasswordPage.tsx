import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, LOGO_FULL_URL } from '../config';

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenMissing] = useState(!token);

  useEffect(() => {
    if (!token) setError('No invite token found in the link. Please check your email and try again.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/set-password', { token, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      await refreshProfile();
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired invite link. Please contact your care team.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell premium-login-shell">
      <div className="login-hero premium-login-hero">
        <span className="eyebrow">{APP_NAME} Patient Portal</span>
        <img src={LOGO_FULL_URL} alt={APP_NAME} style={{ height: 44, width: 'auto', marginBottom: 16, display: 'block' }} />
        <h1>Welcome to your care journey.</h1>
        <p>
          Your care team has created a patient portal account for you. Set a password below to access your
          medical records, treatment schedule, and health reports securely.
        </p>
        <div className="hero-badge-row">
          <span className="hero-badge">Secure &amp; Encrypted</span>
          <span className="hero-badge">Your data, your control</span>
          <span className="hero-badge">HIPAA-compliant</span>
        </div>
      </div>

      <form className="login-form-card premium-login-card" onSubmit={handleSubmit}>
        <div>
          <span className="eyebrow">One-time setup</span>
          <h2>Set Your Password</h2>
          <p>Choose a strong password to protect your health information.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {!tokenMissing && (
          <>
            <label>
              New Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </label>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Setting up your account…' : 'Set Password & Sign In'}
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Already set your password?{' '}
          <a href="/login" style={{ color: 'var(--accent)' }}>Sign in here</a>
        </p>
      </form>
    </div>
  );
}
