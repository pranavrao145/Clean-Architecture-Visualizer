import { describe, expect, it, jest } from '@jest/globals';
import { CreateModuleUseCaseController } from '../../../src/interface_adapter/CreateModuleUseCase/createModuleUseCaseController.js';
import { CreateFeatureController } from '../../../src/interface_adapter/createFeature/createFeatureController.js';
import { CreateUseCaseController } from '../../../src/interface_adapter/createUseCase/createUseCaseController.js';
import { GetUseCaseInfoController } from '../../../src/interface_adapter/getUseCaseInfo/getUseCaseInfoController.js';
import { GetViolationsController } from '../../../src/interface_adapter/getViolations/getViolationsController.js';
import { GraphVerificationController } from '../../../src/interface_adapter/graphVerification/graphVerificationController.js';
import { InitModuleProjectController } from '../../../src/interface_adapter/initModuleProject/initModuleProjectController.js';
import { InitProjectController } from '../../../src/interface_adapter/initProject/initProjectController.js';
import { CreateFeatureInputData } from '../../../src/use_case/createFeature/createFeatureInputData.js';
import { CreateModuleUseCaseInputData } from '../../../src/use_case/createModuleUseCase/createModuleUseCaseInputData.js';
import { CreateUseCaseInputData } from '../../../src/use_case/createUseCase/createUseCaseInputData.js';
import { GetUseCaseInfoInputData } from '../../../src/use_case/getUseCaseInfo/getUseCaseInfoInputData.js';
import { GetViolationsInputData } from '../../../src/use_case/getViolations/GetViolationsInputData.js';
import { GraphVerificationInputData } from '../../../src/use_case/graphVerification/graphVerificationInputData.js';
import { InitModuleProjectInputData } from '../../../src/use_case/initModuleProject/initModuleProjectInputData.js';
import { InitProjectInputData } from '../../../src/use_case/initProject/initProjectInputData.js';

function makeBoundary<T>() {
  return { execute: jest.fn<(inputData: T) => Promise<void>>() };
}

describe('Controllers build input data and pass it to the input boundary', () => {
  it('CreateFeatureController', async () => {
    const boundary = makeBoundary<CreateFeatureInputData>();
    await new CreateFeatureController(boundary).execute('login');
    expect(boundary.execute).toHaveBeenCalledWith(
      new CreateFeatureInputData('login')
    );
  });

  it('CreateModuleUseCaseController', async () => {
    const boundary = makeBoundary<CreateModuleUseCaseInputData>();
    await new CreateModuleUseCaseController(boundary).execute('auth', 'login');
    expect(boundary.execute).toHaveBeenCalledWith(
      new CreateModuleUseCaseInputData('auth', 'login')
    );
  });

  it('CreateUseCaseController', async () => {
    const boundary = makeBoundary<CreateUseCaseInputData>();
    await new CreateUseCaseController(boundary).execute('login');
    expect(boundary.execute).toHaveBeenCalledWith(
      new CreateUseCaseInputData('login')
    );
  });

  it('GetUseCaseInfoController', async () => {
    const boundary = makeBoundary<GetUseCaseInfoInputData>();
    await new GetUseCaseInfoController(boundary).execute('uc-1');
    expect(boundary.execute).toHaveBeenCalledWith(
      new GetUseCaseInfoInputData('uc-1')
    );
  });

  it('GetViolationsController', async () => {
    const boundary = makeBoundary<GetViolationsInputData>();
    await new GetViolationsController(boundary).execute('uc-1');
    expect(boundary.execute).toHaveBeenCalledWith(
      new GetViolationsInputData('uc-1')
    );
  });

  it.each([true, false])('GraphVerificationController (%s)', async (toCli) => {
    const boundary = makeBoundary<GraphVerificationInputData>();
    await new GraphVerificationController(boundary).execute(toCli);
    expect(boundary.execute).toHaveBeenCalledWith(
      new GraphVerificationInputData(toCli)
    );
  });

  it('InitModuleProjectController', async () => {
    const boundary = makeBoundary<InitModuleProjectInputData>();
    await new InitModuleProjectController(boundary).execute('java');
    expect(boundary.execute).toHaveBeenCalledWith(
      new InitModuleProjectInputData('java')
    );
  });

  it('InitProjectController', async () => {
    const boundary = makeBoundary<InitProjectInputData>();
    await new InitProjectController(boundary).execute('java');
    expect(boundary.execute).toHaveBeenCalledWith(
      new InitProjectInputData('java')
    );
  });
});
