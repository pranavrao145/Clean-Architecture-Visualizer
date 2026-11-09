import { HttpResponse, http } from 'msw';
import {
  mockAnalysisSummary,
  mockInteractionDetails,
  mockViolations,
} from './data/analysis';
import { mockPatternAnalyzerResponse } from './data/pattern-analyzer';

export const handlers = [
  http.get('/api/analysis/summary', () =>
    HttpResponse.json(mockAnalysisSummary)
  ),
  http.get('/api/analysis/interaction/:id', () =>
    HttpResponse.json(mockInteractionDetails)
  ),
  http.get('/api/analysis/violations/:interactionId', () =>
    HttpResponse.json(mockViolations)
  ),
  http.post('/api/design-patterns/analyze', () =>
    HttpResponse.json(mockPatternAnalyzerResponse)
  ),
];
