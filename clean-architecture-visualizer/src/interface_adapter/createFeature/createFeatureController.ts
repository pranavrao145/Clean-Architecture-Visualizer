import type { CreateFeatureInputBoundary } from '../../use_case/createFeature/createFeatureInputBoundary.js';
import { CreateFeatureInputData } from '../../use_case/createFeature/createFeatureInputData.js';

export class CreateFeatureController {
  constructor(private readonly inputBoundary: CreateFeatureInputBoundary) {}

  async execute(feature: string): Promise<void> {
    const inputData = new CreateFeatureInputData(feature);
    await this.inputBoundary.execute(inputData);
  }
}
