import { Row, Col, Form, Button } from 'react-bootstrap';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Education',
  'Travel',
  'Groceries',
  'Other',
];

const ExpenseFilter = ({ filters, onFilterChange, onClear }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount;

  return (
    <div className="filter-bar animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <FiFilter color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Filters
          </span>
        </div>
        {hasActiveFilters && (
          <Button
            size="sm"
            className="btn-outline-custom"
            onClick={onClear}
            id="clear-filters-btn"
          >
            <FiX className="me-1" /> Clear All
          </Button>
        )}
      </div>

      <Row className="g-2">
        {/* Search */}
        <Col md={4} sm={6}>
          <div style={{ position: 'relative' }}>
            <FiSearch
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                zIndex: 2,
              }}
            />
            <Form.Control
              type="text"
              name="search"
              value={filters.search || ''}
              onChange={handleChange}
              placeholder="Search expenses..."
              style={{ paddingLeft: '2.2rem' }}
              id="search-expenses"
            />
          </div>
        </Col>

        {/* Category */}
        <Col md={3} sm={6}>
          <Form.Select
            name="category"
            value={filters.category || ''}
            onChange={handleChange}
            id="filter-category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </Col>

        {/* Date Range */}
        <Col md={2} sm={6}>
          <Form.Control
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleChange}
            placeholder="From"
            title="Start Date"
            id="filter-start-date"
          />
        </Col>
        <Col md={2} sm={6}>
          <Form.Control
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleChange}
            placeholder="To"
            title="End Date"
            id="filter-end-date"
          />
        </Col>

        {/* Sort */}
        <Col md={1} sm={6}>
          <Form.Select
            name="sortBy"
            value={filters.sortBy || 'expense_date'}
            onChange={handleChange}
            title="Sort by"
            id="filter-sort"
          >
            <option value="expense_date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Amount Range (collapsible row) */}
      <Row className="g-2 mt-1">
        <Col md={2} sm={6}>
          <Form.Control
            type="number"
            name="minAmount"
            value={filters.minAmount || ''}
            onChange={handleChange}
            placeholder="Min Amount"
            min="0"
            step="0.01"
            id="filter-min-amount"
          />
        </Col>
        <Col md={2} sm={6}>
          <Form.Control
            type="number"
            name="maxAmount"
            value={filters.maxAmount || ''}
            onChange={handleChange}
            placeholder="Max Amount"
            min="0"
            step="0.01"
            id="filter-max-amount"
          />
        </Col>
        <Col md={2} sm={6}>
          <Form.Select
            name="order"
            value={filters.order || 'DESC'}
            onChange={handleChange}
            title="Order"
            id="filter-order"
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </Form.Select>
        </Col>
      </Row>
    </div>
  );
};

export default ExpenseFilter;
