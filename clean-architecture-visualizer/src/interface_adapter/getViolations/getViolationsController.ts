import type { GetViolationsInputBoundary } from '../../use_case/getViolations/GetViolationsInputBoundary.js';
import { GetViolationsInputData } from '../../use_case/getViolations/GetViolationsInputData.js';

export class GetViolationsController {
  constructor(private readonly inputBoundary: GetViolationsInputBoundary) {}

  async execute(useCaseId: string): Promise<void> {
    const inputData = new GetViolationsInputData(useCaseId);
    await this.inputBoundary.execute(inputData);
  }
}
