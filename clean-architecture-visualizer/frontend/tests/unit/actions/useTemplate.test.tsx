import { QueryClient } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateFeature,
  useCreateModuleUseCase,
  useCreateUseCase,
  useGenerateModuleProject,
  useGenerateProject,
} from '@/actions/use-template';
import { server } from '@/mocks/server';
import { renderHook, waitFor } from '../../test-utils';

describe('Template Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('useGenerateProject resolves the template response and invalidates file-tree queries for java', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(`*/api/template/generate/${encodeURIComponent('java')}`, () => {
        return HttpResponse.json(
          { message: 'Project initiated successfully' },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useGenerateProject());

    result.current.mutate('java');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateProject resolves the template response and invalidates file-tree queries for python', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/generate/${encodeURIComponent('python')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateProject());

    result.current.mutate('python');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateProject resolves the template response and invalidates file-tree queries for javascript', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/generate/${encodeURIComponent('javascript')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateProject());

    result.current.mutate('javascript');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateProject resolves the template response and invalidates file-tree queries for typescript', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/generate/${encodeURIComponent('typescript')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateProject());

    result.current.mutate('typescript');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateModuleProject resolves the template response and invalidates file-tree queries for java', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/module_generate/${encodeURIComponent('java')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateModuleProject());

    result.current.mutate('java');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateModuleProject resolves the template response and invalidates file-tree queries for python', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/module_generate/${encodeURIComponent('python')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateModuleProject());

    result.current.mutate('python');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateModuleProject resolves the template response and invalidates file-tree queries for javascript', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/module_generate/${encodeURIComponent('javascript')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateModuleProject());

    result.current.mutate('javascript');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useGenerateModuleProject resolves the template response and invalidates file-tree queries for typescript', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post(
        `*/api/template/module_generate/${encodeURIComponent('typescript')}`,
        () => {
          return HttpResponse.json(
            { message: 'Project initiated successfully' },
            { status: 201 }
          );
        }
      )
    );

    const { result } = renderHook(() => useGenerateModuleProject());

    result.current.mutate('typescript');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('Project initiated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useCreateUseCase resolves the template response and invalidates related queries', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post('*/api/template/add/Add%20User', () => {
        return HttpResponse.json(
          { message: "Use case 'Add User' created successfully" },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useCreateUseCase());

    result.current.mutate('Add User');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe(
      "Use case 'Add User' created successfully"
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['relations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['analysis_summary'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['violations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interactions'] });
  });

  it('useCreateFeature resolves the template response and invalidates related queries', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post('*/api/template/module_add/feature1', () => {
        return HttpResponse.json(
          { message: "Feature 'feature1' created successfully" },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useCreateFeature());

    result.current.mutate('feature1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe(
      "Feature 'feature1' created successfully"
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
  });

  it('useCreateModuleUseCase resolves the template response and invalidates related queries', async () => {
    const invalidateSpy = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockResolvedValue(undefined);

    server.use(
      http.post('*/api/template/module_add/feature1/usecase1', () => {
        return HttpResponse.json(
          {
            message:
              "Use case 'usecase1' created successfully in feature 'feature1'",
          },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useCreateModuleUseCase());

    result.current.mutate({ featureName: 'feature1', useCaseName: 'usecase1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe(
      "Use case 'usecase1' created successfully in feature 'feature1'"
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['file-tree'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['relations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['analysis_summary'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['violations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['interactions'] });
  });
});
