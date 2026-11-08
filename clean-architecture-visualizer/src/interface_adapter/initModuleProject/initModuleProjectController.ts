import type { InitModuleProjectInputBoundary } from '../../use_case/initModuleProject/initModuleProjectInputBoundary.js';
import { InitModuleProjectInputData } from '../../use_case/initModuleProject/initModuleProjectInputData.js';

export class InitModuleProjectController {
  constructor(private readonly inputBoundary: InitModuleProjectInputBoundary) {}

  async execute(language: string): Promise<void> {
    const inputData = new InitModuleProjectInputData(language);
    await this.inputBoundary.execute(inputData);
  }
}
