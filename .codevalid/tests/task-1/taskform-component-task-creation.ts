import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskForm from '../../../frontend/src/components/TaskForm';

// Mock categories/tags and priorities for select fields
const mockCategories = ['Work', 'Personal', 'Urgent'];
const mockPriorities = ['Low', 'Medium', 'High'];

// Helper to render TaskForm with required props
function renderTaskForm(props: Partial<React.ComponentProps<typeof TaskForm>> = {}) {
  const onSubmit = jest.fn();
  render(
    <TaskForm
      onSubmit={onSubmit}
      categories={mockCategories}
      priorities={mockPriorities}
      {...props}
    />
  );
  return { onSubmit };
}

describe('TaskForm Component', () => {
  // Test Case 1: Render All Form Fields
  it('Render All Form Fields', () => {
    renderTaskForm();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  // Test Case 2: Submit With All Valid Fields
  it('Submit With All Valid Fields', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Task' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'High' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Work' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2099-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        category: 'Work',
        dueDate: '2099-12-31',
      });
    });
  });

  // Test Case 3: Submit With Empty Title
  it('Submit With Empty Title', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Medium' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Personal' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2099-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
    });
  });

  // Test Case 4: Submit With Empty Optional Fields
  it('Submit With Empty Optional Fields', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Only Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Low' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Only Title',
        description: '',
        priority: 'Low',
        category: '',
        dueDate: '',
      });
    });
  });

  // Test Case 5: Submit With Whitespace Title
  it('Submit With Whitespace Title', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Medium' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
    });
  });

  // Test Case 6: Change Form Fields
  it('Change Form Fields', () => {
    renderTaskForm();
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(descInput, { target: { value: 'New Description' } });
    fireEvent.change(prioritySelect, { target: { value: 'High' } });
    fireEvent.change(categorySelect, { target: { value: 'Urgent' } });
    fireEvent.change(dueDateInput, { target: { value: '2099-01-01' } });

    expect(titleInput.value).toBe('New Title');
    expect(descInput.value).toBe('New Description');
    expect(prioritySelect.value).toBe('High');
    expect(categorySelect.value).toBe('Urgent');
    expect(dueDateInput.value).toBe('2099-01-01');
  });

  // Test Case 7: Priority Field Options
  it('Priority Field Options', () => {
    renderTaskForm();
    const prioritySelect = screen.getByLabelText(/priority/i);
    mockPriorities.forEach(option => {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    });
    fireEvent.change(prioritySelect, { target: { value: 'Medium' } });
    expect((prioritySelect as HTMLSelectElement).value).toBe('Medium');
  });

  // Test Case 8: Due Date Validation - Invalid Format
  it('Due Date Validation - Invalid Format', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: 'invalid-date' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Low' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/due date.*invalid/i)).toBeInTheDocument();
    });
  });

  // Test Case 9: Category Field Options
  it('Category Field Options', () => {
    renderTaskForm();
    const categorySelect = screen.getByLabelText(/category/i);
    mockCategories.forEach(option => {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    });
    fireEvent.change(categorySelect, { target: { value: 'Personal' } });
    expect((categorySelect as HTMLSelectElement).value).toBe('Personal');
  });

  // Test Case 10: Submit With Long Title and Description
  it('Submit With Long Title and Description', async () => {
    const { onSubmit } = renderTaskForm();
    const longTitle = 'T'.repeat(255);
    const longDesc = 'D'.repeat(1024);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: longTitle } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: longDesc } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'High' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longTitle,
          description: longDesc,
        })
      );
    });
  });

  // Test Case 11: Submit With Special Characters
  it('Submit With Special Characters', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '!@#$%^&*()_+' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '<script>alert("x")</script>' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Low' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Urgent' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2099-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: '!@#$%^&*()_+',
        description: '<script>alert("x")</script>',
        priority: 'Low',
        category: 'Urgent',
        dueDate: '2099-12-31',
      });
    });
  });

  // Test Case 12: Reset Form On Successful Submit
  it('Reset Form On Successful Submit', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Reset Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Reset Description' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Medium' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Work' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2099-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // After submit, fields should reset
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/description/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/priority/i) as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText(/category/i) as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText(/due date/i) as HTMLInputElement).value).toBe('');
  });

  // Test Case 13: Form Error Display On Failed Validation
  it('Form Error Display On Failed Validation', async () => {
    renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
    });
  });

  // Test Case 14: Submit With Past Due Date
  it('Submit With Past Due Date', async () => {
    const { onSubmit } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Past Due' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'Low' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/due date.*past/i)).toBeInTheDocument();
    });
  });
});