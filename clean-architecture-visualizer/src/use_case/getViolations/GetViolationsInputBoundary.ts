import type { GetViolationsInputData } from './GetViolationsInputData.js';

export interface GetViolationsInputBoundary {
  execute(inputData: GetViolationsInputData): Promise<void>;
}
