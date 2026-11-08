import type { CreateModuleUseCaseInputBoundary } from '../../use_case/createModuleUseCase/createModuleUseCaseInputBoundary.js';
import { CreateModuleUseCaseInputData } from '../../use_case/createModuleUseCase/createModuleUseCaseInputData.js';

export class CreateModuleUseCaseController {
  constructor(
    private readonly inputBoundary: CreateModuleUseCaseInputBoundary
  ) {}

  async execute(feature: string, useCaseName: string): Promise<void> {
    const inputData = new CreateModuleUseCaseInputData(feature, useCaseName);
    await this.inputBoundary.execute(inputData);
  }
}
