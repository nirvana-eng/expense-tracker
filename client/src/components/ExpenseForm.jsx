import { useState, useRef } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { uploadService } from '../services/api';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Bills & Utilities', icon: '💡' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health & Fitness', icon: '💪' },
  { name: 'Education', icon: '📚' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Other', icon: '📦' },
];

const ExpenseForm = ({ show, onHide, onSave, expense = null }) => {
  const isEditing = !!expense;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    amount: expense?.amount || '',
    category: expense?.category || '',
    description: expense?.description || '',
    expense_date: expense?.expense_date
      ? new Date(expense.expense_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    receipt_url: expense?.receipt_url || '',
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = 'Amount is required';
    } else if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (amount > 99999999.99) {
      newErrors.amount = 'Amount is too large';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Date validation
    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    } else {
      const inputDate = new Date(formData.expense_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        newErrors.expense_date = 'Date cannot be in the future';
      }
    }

    // Description length
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be under 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WebP or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadService.uploadReceipt(file);
      setFormData((prev) => ({
        ...prev,
        receipt_url: response.data.data.url,
      }));
      toast.success('Receipt uploaded!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onHide();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? '✏️ Edit Expense' : '➕ Add New Expense'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount (₹) *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  isInvalid={!!errors.amount}
                  id="expense-amount"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.amount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  isInvalid={!!errors.expense_date}
                  id="expense-date"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.expense_date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Category *</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.name}
                  type="button"
                  size="sm"
                  className={`px-3 py-2 ${
                    formData.category === cat.name
                      ? 'btn-primary-custom'
                      : 'btn-outline-custom'
                  }`}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, category: cat.name }));
                    if (errors.category) {
                      setErrors((prev) => ({ ...prev, category: '' }));
                    }
                  }}
                  id={`cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </div>
            {errors.category && (
              <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                {errors.category}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What was this expense for?"
              maxLength={500}
              isInvalid={!!errors.description}
              id="expense-description"
            />
            <div
              className="mt-1"
              style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
            >
              {formData.description.length}/500
            </div>
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Receipt (optional)</Form.Label>
            <div
              className="d-flex align-items-center gap-3"
              style={{
                background: 'var(--bg-input)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
              id="receipt-upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="receipt-file-input"
              />

              {uploading ? (
                <Spinner size="sm" />
              ) : formData.receipt_url ? (
                <>
                  <FiCheck color="var(--accent-success)" size={20} />
                  <span style={{ color: 'var(--accent-success)', fontSize: '0.9rem' }}>
                    Receipt attached
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, receipt_url: '' }));
                    }}
                    style={{ color: 'var(--accent-danger)', marginLeft: 'auto' }}
                  >
                    <FiX /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <FiUpload color="var(--text-secondary)" size={20} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Click to upload receipt (JPG, PNG, PDF — max 5MB)
                  </span>
                </>
              )}
            </div>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button className="btn-outline-custom" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="btn-primary-custom"
            disabled={saving}
            id="save-expense-btn"
          >
            {saving ? (
              <Spinner size="sm" className="me-2" />
            ) : null}
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ExpenseForm;
