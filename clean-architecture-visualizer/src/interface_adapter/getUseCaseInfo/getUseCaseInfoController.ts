import type { GetUseCaseInfoInputBoundary } from '../../use_case/getUseCaseInfo/getUseCaseInfoInputBoundary.js';
import { GetUseCaseInfoInputData } from '../../use_case/getUseCaseInfo/getUseCaseInfoInputData.js';

export class GetUseCaseInfoController {
  constructor(private readonly inputBoundary: GetUseCaseInfoInputBoundary) {}

  async execute(useCaseId: string): Promise<void> {
    const inputData = new GetUseCaseInfoInputData(useCaseId);
    await this.inputBoundary.execute(inputData);
  }
}
