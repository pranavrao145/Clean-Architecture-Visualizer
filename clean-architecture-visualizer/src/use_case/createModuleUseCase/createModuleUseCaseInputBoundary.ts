import type { CreateModuleUseCaseInputData } from './createModuleUseCaseInputData.js';

export interface CreateModuleUseCaseInputBoundary {
  execute(inputData: CreateModuleUseCaseInputData): Promise<void>;
}
