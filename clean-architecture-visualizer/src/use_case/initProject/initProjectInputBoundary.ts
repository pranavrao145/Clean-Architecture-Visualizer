import type { InitProjectInputData } from './initProjectInputData.js';

export interface InitProjectInputBoundary {
  execute(inputData: InitProjectInputData): Promise<void>;
}
