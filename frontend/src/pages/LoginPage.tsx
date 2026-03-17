import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, LOGO_FULL_URL } from '../config';

const quickAccess = [
  { role: 'Superadmin', username: 'superadmin', password: 'superadmin123', desc: 'Platform administration' },
  { role: 'Hospital', username: 'hospital', password: 'hospital123', desc: 'Clinical operations' },
  { role: 'Patient', username: 'patient', password: 'patient123', desc: 'Patient portal' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('hospital');
  const [password, setPassword] = useState('hospital123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell premium-login-shell">
      <div className="login-hero premium-login-hero">
        <span className="eyebrow">{APP_NAME} Platform</span>
        <img src={LOGO_FULL_URL} alt={APP_NAME} style={{ height: 44, width: 'auto', maxWidth: '100%', objectFit: 'contain', marginBottom: 16, alignSelf: 'flex-start' }} />
        <h1>Diagnosis confirmed. Treatment planned. Symptoms tracked. Payer revenue protected.</h1>
        <p>
          A cleaner oncology workspace centered around four cancers, AI-assisted interpretation, treatment planning,
          symptom reporting, and payer submission.
        </p>
        <div className="hero-badge-row">
          <span className="hero-badge">4 supported cancers</span>
          <span className="hero-badge">AI-assisted staging</span>
          <span className="hero-badge">Payer-first revenue flow</span>
        </div>
        <div className="demo-grid">
          {quickAccess.map((account) => (
            <button
              type="button"
              key={account.role}
              className="demo-card"
              onClick={() => {
                setUsername(account.username);
                setPassword(account.password);
              }}
            >
              <strong>{account.role}</strong>
              <span>{account.username}</span>
              <small>{account.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <form className="login-form-card premium-login-card" onSubmit={handleSubmit}>
        <div>
          <span className="eyebrow">Secure Sign In</span>
          <h2>Sign In</h2>
          <p>Enter your credentials to access the oncology platform.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username or email" required />
          <small style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
            Patients: use your registered email address as your username.
          </small>
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? (
            <span className="button-loader-wrap"><Loader inline size="sm" label="Signing in…" /></span>
          ) : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
