import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/api';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiPlusCircle,
  FiArrowRight,
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await expenseService.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="spinner-custom" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const recent = stats?.recent || [];
  const categories = stats?.categories || [];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Container className="page-container">
      {/* Header */}
      <div className="mb-4 animate-fade-in">
        <h1 className="page-title">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="page-subtitle">
          Here&apos;s your financial overview
        </p>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-1">
            <div
              className="stat-icon"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
            >
              <FiDollarSign />
            </div>
            <div className="stat-value">{formatAmount(overview.totalSpending)}</div>
            <div className="stat-label">Total Spending</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              {overview.totalExpenses || 0} expenses recorded
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-2">
            <div
              className="stat-icon"
              style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}
            >
              <FiCalendar />
            </div>
            <div className="stat-value">{formatAmount(overview.thisMonth)}</div>
            <div className="stat-label">This Month</div>
            <div
              className={`stat-change ${
                overview.percentChange >= 0 ? 'negative' : 'positive'
              }`}
            >
              {overview.percentChange >= 0 ? (
                <FiTrendingUp className="me-1" />
              ) : (
                <FiTrendingDown className="me-1" />
              )}
              {Math.abs(overview.percentChange || 0)}% vs last month
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-3">
            <div
              className="stat-icon"
              style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}
            >
              <FiDollarSign />
            </div>
            <div className="stat-value">{formatAmount(overview.lastMonth)}</div>
            <div className="stat-label">Last Month</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              Previous period
            </div>
          </div>
        </Col>

        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-4">
            <div
              className="stat-icon"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
            >
              <FiTrendingUp />
            </div>
            <div className="stat-value">
              {categories.length > 0 ? categories[0]?.name?.split(' ')[0] : '—'}
            </div>
            <div className="stat-label">Top Category</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              {categories.length > 0
                ? formatAmount(categories[0]?.total)
                : 'No data yet'}
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Recent Expenses */}
        <Col lg={7}>
          <div className="card-dark animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>📋 Recent Expenses</span>
              <Link
                to="/expenses"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body">
              {recent.length === 0 ? (
                <div className="empty-state py-4">
                  <div className="empty-icon">📝</div>
                  <h4>No expenses yet</h4>
                  <p className="mb-3">Start tracking by adding your first expense</p>
                  <Link to="/expenses">
                    <Button className="btn-primary-custom">
                      <FiPlusCircle className="me-2" />
                      Add Expense
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  {recent.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="d-flex justify-content-between align-items-center py-3 animate-slide-in"
                      style={{
                        borderBottom:
                          index < recent.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        animationDelay: `${0.4 + index * 0.1}s`,
                        opacity: 0,
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                          }}
                        >
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {expense.category}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {expense.description || formatDate(expense.expense_date)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        }).format(expense.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Category Breakdown */}
        <Col lg={5}>
          <div className="card-dark animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">📊 Category Breakdown</div>
            <div className="card-body">
              {categories.length === 0 ? (
                <div className="empty-state py-3">
                  <p style={{ color: 'var(--text-muted)' }}>
                    No expense data yet
                  </p>
                </div>
              ) : (
                <div>
                  {categories.slice(0, 6).map((cat, index) => {
                    const maxTotal = categories[0]?.total || 1;
                    const percentage = ((cat.total / maxTotal) * 100).toFixed(0);

                    return (
                      <div
                        key={cat.name}
                        className="mb-3 animate-slide-in"
                        style={{
                          animationDelay: `${0.5 + index * 0.1}s`,
                          opacity: 0,
                        }}
                      >
                        <div className="d-flex justify-content-between mb-1">
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {getCategoryIcon(cat.name)} {cat.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              minimumFractionDigits: 0,
                            }).format(cat.total)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            borderRadius: '3px',
                            background: 'var(--bg-input)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percentage}%`,
                              background: 'var(--gradient-primary)',
                              borderRadius: '3px',
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                          }}
                        >
                          {cat.count} expense{cat.count !== 1 ? 's' : ''} · Avg{' '}
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0,
                          }).format(cat.average)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

// Helper function
function getCategoryIcon(category) {
  const icons = {
    'Food & Dining': '🍔',
    'Transportation': '🚗',
    'Shopping': '🛍️',
    'Bills & Utilities': '💡',
    'Entertainment': '🎬',
    'Health & Fitness': '💪',
    'Education': '📚',
    'Travel': '✈️',
    'Groceries': '🛒',
    'Other': '📦',
  };
  return icons[category] || '📦';
}

export default Dashboard;
