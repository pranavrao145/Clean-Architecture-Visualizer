import { useQuery } from '@tanstack/react-query';
import { analyzePatterns } from '../api/designPatterns.api';

// Analyses the codebase when the page opens.
export const usePatternAnalyzer = (patternIds: string[]) =>
  useQuery({
    queryKey: ['pattern-analyzer'],
    queryFn: () => analyzePatterns(patternIds),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
