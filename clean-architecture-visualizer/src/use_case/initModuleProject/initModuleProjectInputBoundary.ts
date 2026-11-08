import type { InitModuleProjectInputData } from './initModuleProjectInputData.js';

export interface InitModuleProjectInputBoundary {
  execute(inputData: InitModuleProjectInputData): Promise<void>;
}
