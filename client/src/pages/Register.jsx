import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength indicators
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*?&#^()_\-+=]/.test(formData.password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'var(--accent-danger)';
    if (passwordStrength <= 3) return 'var(--accent-warning)';
    if (passwordStrength <= 4) return 'var(--accent-info)';
    return 'var(--accent-success)';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!formData.email) {
      setError('Email is required.');
      return;
    }
    if (passwordStrength < 5) {
      setError('Please meet all password requirements.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name.trim(), formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck = ({ passed, label }) => (
    <div
      className="d-flex align-items-center gap-1 mb-1"
      style={{
        fontSize: '0.78rem',
        color: passed ? 'var(--accent-success)' : 'var(--text-muted)',
      }}
    >
      {passed ? <FiCheck size={12} /> : <FiX size={12} />}
      {label}
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">💰</div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start tracking your expenses today</p>

        {error && (
          <Alert
            variant="danger"
            className="mb-3"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--accent-danger)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FiUser className="me-1" /> Full Name
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              maxLength={100}
              autoComplete="name"
              id="register-name"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FiMail className="me-1" /> Email
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              maxLength={255}
              autoComplete="email"
              id="register-email"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FiLock className="me-1" /> Password
            </Form.Label>
            <div style={{ position: 'relative' }}>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                maxLength={128}
                autoComplete="new-password"
                id="register-password"
              />
              <Button
                variant="link"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                  zIndex: 5,
                }}
                type="button"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </Button>
            </div>

            {/* Password strength bar */}
            {formData.password && (
              <div className="mt-2">
                <div
                  style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--bg-input)',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(passwordStrength / 5) * 100}%`,
                      background: getStrengthColor(),
                      borderRadius: '2px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: getStrengthColor(),
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  Password strength: {getStrengthLabel()}
                </div>
                <PasswordCheck
                  passed={passwordChecks.length}
                  label="At least 8 characters"
                />
                <PasswordCheck
                  passed={passwordChecks.uppercase}
                  label="One uppercase letter"
                />
                <PasswordCheck
                  passed={passwordChecks.lowercase}
                  label="One lowercase letter"
                />
                <PasswordCheck
                  passed={passwordChecks.number}
                  label="One number"
                />
                <PasswordCheck
                  passed={passwordChecks.special}
                  label="One special character (@$!%*?&#)"
                />
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>
              <FiLock className="me-1" /> Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              id="register-confirm-password"
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent-danger)',
                    marginTop: '0.3rem',
                  }}
                >
                  Passwords do not match
                </div>
              )}
          </Form.Group>

          <Button
            type="submit"
            className="btn-primary-custom w-100 mb-3"
            disabled={loading}
            id="register-submit-btn"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </Form>

        <p
          className="text-center mb-0"
          style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
