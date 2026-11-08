import type { GraphVerificationInputData } from './graphVerificationInputData.js';

export interface GraphVerificationInputBoundary {
  execute(inputData: GraphVerificationInputData): Promise<void>;
}
