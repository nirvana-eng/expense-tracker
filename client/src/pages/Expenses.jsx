import { useState, useEffect, useCallback } from 'react';
import { Container, Button } from 'react-bootstrap';
import { FiPlusCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { expenseService } from '../services/api';
import ExpenseList from '../components/ExpenseList';
import ExpenseFilter from '../components/ExpenseFilter';
import ExpenseForm from '../components/ExpenseForm';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'expense_date',
    order: 'DESC',
    page: 1,
    limit: 10,
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      // Build query params, removing empty values
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      const response = await expenseService.getAll(params);
      setExpenses(response.data.data.expenses);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load expenses');
      console.error('Fetch expenses error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchExpenses]);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'expense_date',
      order: 'DESC',
      page: 1,
      limit: 10,
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleSaveExpense = async (data) => {
    try {
      if (editingExpense) {
        await expenseService.update(editingExpense.id, data);
        toast.success('Expense updated successfully!');
      } else {
        await expenseService.create(data);
        toast.success('Expense added successfully!');
      }
      fetchExpenses();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Failed to save expense';
      toast.error(msg);
      throw error; // Re-throw to keep form open
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.delete(id);
      toast.success('Expense deleted!');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <Container className="page-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 animate-fade-in">
        <div>
          <h1 className="page-title">💸 Expenses</h1>
          <p className="page-subtitle mb-0">
            Manage and track all your expenses
          </p>
        </div>
        <Button
          className="btn-primary-custom"
          onClick={handleAddExpense}
          id="add-expense-btn"
        >
          <FiPlusCircle className="me-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <ExpenseFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Expense List */}
      <ExpenseList
        expenses={expenses}
        pagination={pagination}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          show={showForm}
          onHide={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          expense={editingExpense}
        />
      )}
    </Container>
  );
};

export default Expenses;
