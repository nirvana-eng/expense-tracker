import { Table, Button, Badge, Pagination } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiFileText, FiImage } from 'react-icons/fi';

const CATEGORY_STYLES = {
  'Food & Dining': 'cat-food',
  'Transportation': 'cat-transport',
  'Shopping': 'cat-shopping',
  'Bills & Utilities': 'cat-bills',
  'Entertainment': 'cat-entertainment',
  'Health & Fitness': 'cat-health',
  'Education': 'cat-education',
  'Travel': 'cat-travel',
  'Groceries': 'cat-groceries',
  'Other': 'cat-other',
};

const CATEGORY_ICONS = {
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

const ExpenseList = ({
  expenses,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  loading,
}) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="spinner-custom">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-icon">💸</div>
        <h4>No expenses found</h4>
        <p>Add your first expense or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Desktop Table */}
      <div className="d-none d-md-block">
        <div className="table-responsive">
          <Table className="table-dark-custom">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Receipt</th>
                <th className="text-end">Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr
                  key={expense.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDate(expense.expense_date)}
                  </td>
                  <td>
                    <Badge className={`badge-category ${CATEGORY_STYLES[expense.category] || 'cat-other'}`}>
                      {CATEGORY_ICONS[expense.category] || '📦'} {expense.category}
                    </Badge>
                  </td>
                  <td
                    style={{
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-secondary)',
                    }}
                    title={expense.description}
                  >
                    {expense.description || '—'}
                  </td>
                  <td>
                    {expense.receipt_url ? (
                      <a
                        href={`http://localhost:5000${expense.receipt_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View receipt"
                      >
                        {expense.receipt_url.endsWith('.pdf') ? (
                          <FiFileText size={18} color="var(--accent-warning)" />
                        ) : (
                          <FiImage size={18} color="var(--accent-info)" />
                        )}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="text-end" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatAmount(expense.amount)}
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      className="btn-outline-custom me-1"
                      onClick={() => onEdit(expense)}
                      title="Edit"
                      id={`edit-expense-${expense.id}`}
                    >
                      <FiEdit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      className="btn-danger-custom"
                      onClick={() => onDelete(expense.id)}
                      title="Delete"
                      id={`delete-expense-${expense.id}`}
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="d-md-none">
        {expenses.map((expense, index) => (
          <div
            key={expense.id}
            className="card-dark mb-3 animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <Badge className={`badge-category ${CATEGORY_STYLES[expense.category] || 'cat-other'}`}>
                  {CATEGORY_ICONS[expense.category]} {expense.category}
                </Badge>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {formatAmount(expense.amount)}
                </span>
              </div>
              {expense.description && (
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {expense.description}
                </p>
              )}
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {formatDate(expense.expense_date)}
                </span>
                <div>
                  <Button
                    size="sm"
                    className="btn-outline-custom me-1"
                    onClick={() => onEdit(expense)}
                  >
                    <FiEdit2 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    className="btn-danger-custom"
                    onClick={() => onDelete(expense.id)}
                  >
                    <FiTrash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Showing {expenses.length} of {pagination.totalCount} expenses
          </span>
          <Pagination className="pagination-custom mb-0">
            <Pagination.Prev
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            />
            {[...Array(pagination.totalPages)].map((_, i) => {
              const page = i + 1;
              // Show max 5 pages around current
              if (
                page === 1 ||
                page === pagination.totalPages ||
                Math.abs(page - pagination.currentPage) <= 2
              ) {
                return (
                  <Pagination.Item
                    key={page}
                    active={page === pagination.currentPage}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              }
              if (
                page === pagination.currentPage - 3 ||
                page === pagination.currentPage + 3
              ) {
                return <Pagination.Ellipsis key={page} disabled />;
              }
              return null;
            })}
            <Pagination.Next
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
