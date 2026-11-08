import type { InitProjectInputBoundary } from '../../use_case/initProject/initProjectInputBoundary.js';
import { InitProjectInputData } from '../../use_case/initProject/initProjectInputData.js';

export class InitProjectController {
  constructor(private readonly inputBoundary: InitProjectInputBoundary) {}

  async execute(language: string): Promise<void> {
    const inputData = new InitProjectInputData(language);
    await this.inputBoundary.execute(inputData);
  }
}
