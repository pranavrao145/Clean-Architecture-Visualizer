import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FileAccessInterface } from '../../../src/data_access/fileAccessInterface.js';
import { CreateModuleUseCaseInputData } from '../../../src/use_case/createModuleUseCase/createModuleUseCaseInputData.js';
import { CreateModuleUseCaseInteractor } from '../../../src/use_case/createModuleUseCase/createModuleUseCaseInteractor.js';
import type { CreateModuleUseCaseOutputBoundary } from '../../../src/use_case/createModuleUseCase/createModuleUseCaseOutputBoundary.js';
import { CreateModuleUseCaseOutputData } from '../../../src/use_case/createModuleUseCase/createModuleUseCaseOutputData.js';
import { makeMockFileAccess } from '../doubles/mock-file-access.js';

describe('CreateFeatureInteractor', () => {
  let mockFileAccess: jest.Mocked<FileAccessInterface>;
  let mockPresenter: jest.Mocked<CreateModuleUseCaseOutputBoundary>;
  let outputData: CreateModuleUseCaseOutputData;

  beforeEach(() => {
    mockFileAccess = makeMockFileAccess();

    mockPresenter = {
      showSuccessView:
        jest.fn<CreateModuleUseCaseOutputBoundary['showSuccessView']>(),
      showFailView:
        jest.fn<CreateModuleUseCaseOutputBoundary['showFailView']>(),
    };

    outputData = new CreateModuleUseCaseOutputData();
  });

  function runInteractor(feature: string, usecase: string) {
    const interactor = new CreateModuleUseCaseInteractor(
      mockFileAccess,
      mockPresenter,
      outputData
    );
    return interactor.execute(
      new CreateModuleUseCaseInputData(feature, usecase)
    );
  }

  it('Successfully creates files in specified directories in specified use case in specified feature in java.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('/root/src/java');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    await runInteractor('newFeature', 'newUseCase');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/interface_adapter'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/use_case'
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseInputBoundary.java')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseUseCaseInteractor.java')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseController.java')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledTimes(7);

    expect(outputData.getFeature()).toBe('newFeature');
    expect(outputData.getUseCase()).toBe('newUseCase');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Successfully creates files in specified directories in specified use case in specified feature in python.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    await runInteractor('newFeature', 'newUseCase');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/interface_adapter'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/use_case'
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseInputBoundary.py')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseUseCaseInteractor.py')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseController.py')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledTimes(7);

    expect(outputData.getFeature()).toBe('newFeature');
    expect(outputData.getUseCase()).toBe('newUseCase');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Successfully creates files in specified directories in specified use case in specified feature in javascript.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('/root/src/javascript');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    await runInteractor('newFeature', 'newUseCase');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/interface_adapter'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/use_case'
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseInputBoundary.js')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseUseCaseInteractor.js')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseController.js')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledTimes(7);

    expect(outputData.getFeature()).toBe('newFeature');
    expect(outputData.getUseCase()).toBe('newUseCase');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Successfully creates files in specified directories in specified use case in specified feature in typescript.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('/root/src/typescript');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    await runInteractor('newFeature', 'newUseCase');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/interface_adapter'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newFeature/newUseCase/use_case'
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseInputBoundary.ts')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseUseCaseInteractor.ts')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('newUseCaseController.ts')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledTimes(7);

    expect(outputData.getFeature()).toBe('newFeature');
    expect(outputData.getUseCase()).toBe('newUseCase');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Fails to create files because features directory does not exist.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    // bfsFindDir will only run once when trying to find features
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce('/root/src/python')
      .mockResolvedValueOnce(null);
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'The features directory does not exist. Please initialize the project first.'
    );
  });

  it('Fails to create files because input feature does not exist.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('root/src/typescript');

    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(async (_, dirName) => null);
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'The input feature does not exist in the features directory. Please choose a feature that does exist or create this feature.'
    );
  });

  it('Fails to create files because use case already exists.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/newFeature/${dirName}`
      );
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'The input usecase already exists. Please choose a different name.'
    );
  });
  it('Fails to create files because use case already exists in another directory.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/blah/${dirName}`
      );
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'The input usecase already exists. Please choose a different name.'
    );
  });

  it('Fails if an unexpected error occurs during directory creation.', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    mockFileAccess.createDirectory.mockRejectedValue(new Error('Disk Full'));
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });

  it('Fails if an unexpected error occurs during file creation.', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir
      .mockImplementationOnce(async (_, dirName) => `/root/src/${dirName}`)
      .mockImplementationOnce(
        async (_, dirName) => `/root/src/features/${dirName}`
      )
      .mockImplementationOnce(async (_, dirName) => null);
    mockFileAccess.createFile.mockRejectedValue(
      new Error('Failed to create directory.')
    );
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });

  it('Fails if there is no specified language.', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValue(null)
      .mockResolvedValue(null)
      .mockResolvedValue(null)
      .mockResolvedValue(null);
    await runInteractor('newFeature', 'newUseCase');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });
});
