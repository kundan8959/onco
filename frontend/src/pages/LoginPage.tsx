import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const demoAccounts = [
  { role: 'Superadmin', username: 'superadmin', password: 'superadmin123', desc: 'Platform control, tenants, analytics' },
  { role: 'Hospital', username: 'hospital', password: 'hospital123', desc: 'Diagnosis, planning, payer, symptom flow' },
  { role: 'Patient', username: 'patient', password: 'patient123', desc: 'Treatment plan, metrics, documents' },
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
        <span className="eyebrow">OncoFlow Platform</span>
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
          {demoAccounts.map((account) => (
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
          <h2>Enter workspace</h2>
          <p>Use a seeded role to review the end-to-end oncology flow live.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
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
