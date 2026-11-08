import type { CreateFeatureInputData } from './createFeatureInputData.js';

export interface CreateFeatureInputBoundary {
  execute(inputData: CreateFeatureInputData): Promise<void>;
}
