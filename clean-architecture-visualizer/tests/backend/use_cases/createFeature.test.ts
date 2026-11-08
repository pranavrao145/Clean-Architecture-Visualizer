import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FileAccessInterface } from '../../../src/data_access/fileAccessInterface.js';
import { CreateFeatureInputData } from '../../../src/use_case/createFeature/createFeatureInputData.js';
import { CreateFeatureInteractor } from '../../../src/use_case/createFeature/createFeatureInteractor.js';
import type { CreateFeatureOutputBoundary } from '../../../src/use_case/createFeature/createFeatureOutputBoundary.js';
import { CreateFeatureOutputData } from '../../../src/use_case/createFeature/createFeatureOutputData.js';
import { makeMockFileAccess } from '../doubles/mock-file-access.js';

describe('CreateFeatureInteractor', () => {
  let mockFileAccess: jest.Mocked<FileAccessInterface>;
  let mockPresenter: jest.Mocked<CreateFeatureOutputBoundary>;
  let outputData: CreateFeatureOutputData;

  beforeEach(() => {
    mockFileAccess = makeMockFileAccess();

    mockPresenter = {
      showSuccessView:
        jest.fn<CreateFeatureOutputBoundary['showSuccessView']>(),
      showFailView: jest.fn<CreateFeatureOutputBoundary['showFailView']>(),
    };

    outputData = new CreateFeatureOutputData();
  });

  function runInteractor(name: string) {
    const interactor = new CreateFeatureInteractor(
      mockFileAccess,
      mockPresenter,
      outputData
    );
    return interactor.execute(new CreateFeatureInputData(name));
  }

  it('Successfully adds feature to features directory.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root/src');
    mockFileAccess.bfsFindDir.mockResolvedValue('/root/src/features');
    mockFileAccess.exists.mockResolvedValue(false);
    await runInteractor('new_feature');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/new_feature'
    );

    expect(outputData.getFeature()).toBe('new_feature');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Successfully adds feature to features directory that has space in name.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root/src');
    mockFileAccess.bfsFindDir.mockResolvedValue('/root/src/features');
    mockFileAccess.exists.mockResolvedValue(false);
    await runInteractor('new feature with spaces');

    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/features/newfeaturewithspaces'
    );

    expect(outputData.getFeature()).toBe('newfeaturewithspaces');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('Fails to add feature because features directory does not exist.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root/src');
    mockFileAccess.bfsFindDir.mockResolvedValue(null);
    await runInteractor('blah');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });

  it('Fails to add feature that already exists.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root/src');
    mockFileAccess.bfsFindDir.mockResolvedValue('/root/src/features');
    mockFileAccess.exists.mockResolvedValue(true);
    await runInteractor('new_feature');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });

  it('Fails if unexpected error occurs during directory creation.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue('/root/src');
    mockFileAccess.bfsFindDir.mockResolvedValue('/root/src/features');
    mockFileAccess.exists.mockResolvedValue(true);
    mockFileAccess.createDirectory.mockRejectedValue(
      new Error('Failed to create directory.')
    );
    await runInteractor('new_feature');
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });
});
