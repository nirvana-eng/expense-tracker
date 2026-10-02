import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiDollarSign,
  FiBarChart2,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on auth pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  if (!isAuthenticated) return null;

  return (
    <BSNavbar expand="lg" className="navbar-custom sticky-top">
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          💰 ExpenseTracker
        </BSNavbar.Brand>

        <BSNavbar.Toggle
          aria-controls="main-navbar"
          style={{
            border: '1px solid var(--border-color)',
            padding: '0.4rem 0.6rem',
          }}
        >
          <span
            style={{
              display: 'block',
              width: '22px',
              height: '2px',
              background: 'var(--text-secondary)',
              margin: '5px 0',
              transition: 'all 0.3s',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '22px',
              height: '2px',
              background: 'var(--text-secondary)',
              margin: '5px 0',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '22px',
              height: '2px',
              background: 'var(--text-secondary)',
              margin: '5px 0',
            }}
          />
        </BSNavbar.Toggle>

        <BSNavbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
            >
              <FiHome className="me-1" /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/expenses"
              className={location.pathname === '/expenses' ? 'active' : ''}
            >
              <FiDollarSign className="me-1" /> Expenses
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/analytics"
              className={location.pathname === '/analytics' ? 'active' : ''}
            >
              <FiBarChart2 className="me-1" /> Analytics
            </Nav.Link>
          </Nav>

          <Nav className="align-items-center">
            <Nav.Item className="me-3">
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiUser />
                {user?.name || 'User'}
              </span>
            </Nav.Item>
            <Button
              onClick={handleLogout}
              className="btn-outline-custom"
              size="sm"
            >
              <FiLogOut className="me-1" /> Logout
            </Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
