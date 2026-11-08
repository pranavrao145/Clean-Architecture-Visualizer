import type { CreateUseCaseInputBoundary } from '../../use_case/createUseCase/createUseCaseInputBoundary.js';
import { CreateUseCaseInputData } from '../../use_case/createUseCase/createUseCaseInputData.js';

export class CreateUseCaseController {
  constructor(private readonly inputBoundary: CreateUseCaseInputBoundary) {}

  async execute(useCaseName: string): Promise<void> {
    const inputData = new CreateUseCaseInputData(useCaseName);
    await this.inputBoundary.execute(inputData);
  }
}
