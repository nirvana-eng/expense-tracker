import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { expenseService } from '../services/api';

const COLORS = [
  '#6366f1',
  '#06b6d4',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

const CATEGORY_COLORS = {
  'Food & Dining': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Shopping': '#45B7D1',
  'Bills & Utilities': '#96CEB4',
  'Entertainment': '#FFEAA7',
  'Health & Fitness': '#DDA0DD',
  'Education': '#98D8C8',
  'Travel': '#F7DC6F',
  'Groceries': '#82E0AA',
  'Other': '#AEB6BF',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            marginBottom: '0.3rem',
          }}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              color: entry.color || 'var(--accent-primary)',
              fontWeight: 600,
              fontSize: '0.95rem',
              margin: 0,
            }}
          >
            ₹{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p style={{ fontWeight: 600, color: payload[0].payload.fill, margin: 0 }}>
          {payload[0].name}
        </p>
        <p
          style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            margin: '0.2rem 0 0',
          }}
        >
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
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
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
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

  if (!stats) {
    return (
      <Container className="page-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No Data Available</h4>
          <p>Start adding expenses to see your analytics.</p>
        </div>
      </Container>
    );
  }

  const { overview, monthly, categories } = stats;

  // Prepare monthly data (reverse for chronological order)
  const monthlyData = [...(monthly || [])].reverse().map((m) => ({
    name: m.label,
    total: m.total,
    count: m.count,
  }));

  // Prepare category data
  const categoryData = (categories || []).map((c) => ({
    name: c.name,
    value: c.total,
    count: c.count,
    fill: CATEGORY_COLORS[c.name] || '#6366f1',
  }));

  // Average daily spending this month
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = new Date().getDate();
  const dailyAvg = overview.thisMonth > 0 ? (overview.thisMonth / dayOfMonth).toFixed(0) : 0;
  const projectedMonthly = (dailyAvg * daysInMonth).toFixed(0);

  return (
    <Container className="page-container">
      {/* Header */}
      <div className="mb-4 animate-fade-in">
        <h1 className="page-title">📊 Analytics</h1>
        <p className="page-subtitle">
          Insights into your spending patterns
        </p>
      </div>

      {/* Quick Stats */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-1">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              ₹{Number(dailyAvg).toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Daily Average</div>
          </div>
        </Col>
        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-2">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              ₹{Number(projectedMonthly).toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Projected This Month</div>
          </div>
        </Col>
        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-3">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {categories?.length || 0}
            </div>
            <div className="stat-label">Categories Used</div>
          </div>
        </Col>
        <Col md={3} sm={6}>
          <div className="stat-card animate-fade-in stagger-4">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {overview?.totalExpenses || 0}
            </div>
            <div className="stat-label">Total Transactions</div>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Monthly Spending Trend */}
        <Col lg={8}>
          <div className="chart-container animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h5
              style={{
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              📈 Monthly Spending Trend
            </h5>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(99, 102, 241, 0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorTotal)"
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state py-4">
                <p>No monthly data available yet</p>
              </div>
            )}
          </div>
        </Col>

        {/* Category Pie Chart */}
        <Col lg={4}>
          <div className="chart-container animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h5
              style={{
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              🍩 By Category
            </h5>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state py-4">
                <p>No category data yet</p>
              </div>
            )}
          </div>
        </Col>

        {/* Category Bar Chart */}
        <Col lg={12}>
          <div className="chart-container animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h5
              style={{
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              📊 Spending by Category
            </h5>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(99, 102, 241, 0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state py-4">
                <p>Add expenses to see category breakdown</p>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;
