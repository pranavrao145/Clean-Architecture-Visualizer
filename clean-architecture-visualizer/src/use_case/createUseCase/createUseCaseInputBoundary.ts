import type { CreateUseCaseInputData } from './createUseCaseInputData.js';

export interface CreateUseCaseInputBoundary {
  execute(inputData: CreateUseCaseInputData): Promise<void>;
}
