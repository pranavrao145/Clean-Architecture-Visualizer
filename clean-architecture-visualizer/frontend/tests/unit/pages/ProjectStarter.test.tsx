import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectStarter from '../../../src/pages/ProjectStarter';
import { fireEvent, render, screen } from '../../test-utils';

const templateMock = vi.hoisted(() => ({
  generateMutation: vi.fn(),
  createMutation: vi.fn(),
  generatePending: false,
  createPending: false,
}));

vi.mock('@/actions/use-template', () => ({
  useGenerateProject: () => ({
    mutate: templateMock.generateMutation,
    isPending: templateMock.generatePending,
  }),
  useCreateUseCase: () => ({
    mutate: templateMock.createMutation,
    isPending: templateMock.createPending,
  }),
}));

describe('ProjectStarter Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateMock.generatePending = false;
    templateMock.createPending = false;

    templateMock.generateMutation.mockImplementation((_payload, options) => {
      options?.onSuccess?.({ message: 'Project initiated successfully' });
    });

    templateMock.createMutation.mockImplementation((useCaseName, options) => {
      options?.onSuccess?.({
        message: `Use case '${useCaseName}' created successfully`,
      });
    });
  });

  it('renders the main Project Starter controls', () => {
    render(<ProjectStarter />);

    expect(screen.getByText('startNew.title')).toBeInTheDocument();
    expect(screen.getByText('addUseCase.title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'startNew.button' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'addUseCase.button' })
    ).toBeInTheDocument();
  });

  it('shows a success snackbar after generating a project in java', async () => {
    render(<ProjectStarter />);

    fireEvent.click(screen.getByRole('button', { name: 'startNew.button' }));

    expect(templateMock.generateMutation).toHaveBeenCalledWith(
      'java',
      expect.any(Object)
    );
    expect(
      await screen.findByText('Project initiated successfully')
    ).toBeInTheDocument();
  });

  it('trims the use case name before creating files', async () => {
    render(<ProjectStarter />);

    const input = screen.getByLabelText('addUseCase.inputLabel');
    fireEvent.change(input, { target: { value: '  Add User  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'addUseCase.button' }));

    expect(templateMock.createMutation).toHaveBeenCalledWith(
      'Add User',
      expect.any(Object)
    );
    expect(
      await screen.findByText("Use case 'Add User' created successfully")
    ).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not submit when the use case name is blank', () => {
    render(<ProjectStarter />);

    const createButton = screen.getByRole('button', {
      name: 'addUseCase.button',
    });

    expect(createButton).toBeDisabled();
    expect(templateMock.createMutation).not.toHaveBeenCalled();
  });

  it('submits via Enter key when use case name is non-empty', async () => {
    render(<ProjectStarter />);

    const input = screen.getByLabelText('addUseCase.inputLabel');
    fireEvent.change(input, { target: { value: 'ProcessPayment' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(templateMock.createMutation).toHaveBeenCalledWith(
      'ProcessPayment',
      expect.any(Object)
    );
    expect(
      await screen.findByText("Use case 'ProcessPayment' created successfully")
    ).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not submit via Enter key when use case name is blank', () => {
    render(<ProjectStarter />);

    const input = screen.getByLabelText('addUseCase.inputLabel');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(templateMock.createMutation).not.toHaveBeenCalled();
  });
});
