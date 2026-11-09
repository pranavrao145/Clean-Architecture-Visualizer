import type { PatternAnalyzerResponse } from '../lib/pattern-analyzer-view-model';
import apiClient from './apiClient';

export const analyzePatterns = async (
  patternIds: string[]
): Promise<PatternAnalyzerResponse> => {
  const { data } = await apiClient.post<PatternAnalyzerResponse>(
    '/design-patterns/analyze',
    { patternIds }
  );
  return data;
};
