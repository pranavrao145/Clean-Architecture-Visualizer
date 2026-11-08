import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFeature,
  createModuleUseCase,
  createUseCase,
  generateModuleProject,
  generateProject,
} from '../api/template.api.ts';

export const useGenerateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: string) => generateProject(language),
    onSuccess: () => {
      // invalidate data here
      queryClient.invalidateQueries({ queryKey: ['file-tree'] });
    },
  });
};

export const useGenerateModuleProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: string) => generateModuleProject(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-tree'] });
    },
  });
};

export const useCreateFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featureName: string) => createFeature(featureName),
    onSuccess: () => {
      // Creating a new feature only changes the file-tree
      queryClient.invalidateQueries({ queryKey: ['file-tree'] });
    },
  });
};

export const useCreateUseCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (useCaseName: string) => createUseCase(useCaseName),
    onSuccess: () => {
      // Refresh codebase view after adding new files
      queryClient.invalidateQueries({ queryKey: ['file-tree'] });
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['analysis_summary'] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
};

export const useCreateModuleUseCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      featureName,
      useCaseName,
    }: {
      featureName: string;
      useCaseName: string;
    }) => createModuleUseCase(featureName, useCaseName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-tree'] });
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['analysis_summary'] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
};
