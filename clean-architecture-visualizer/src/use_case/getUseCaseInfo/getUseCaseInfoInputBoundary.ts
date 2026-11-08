import type { GetUseCaseInfoInputData } from './getUseCaseInfoInputData.js';

export interface GetUseCaseInfoInputBoundary {
  execute(inputData: GetUseCaseInfoInputData): Promise<void>;
}
