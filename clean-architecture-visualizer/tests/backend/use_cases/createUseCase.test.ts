import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FileAccessInterface } from '../../../src/data_access/fileAccessInterface.js';
import { CreateUseCaseInputData } from '../../../src/use_case/createUseCase/createUseCaseInputData.js';
import { CreateUseCaseInteractor } from '../../../src/use_case/createUseCase/createUseCaseInteractor.js';
import type { CreateUseCaseOutputBoundary } from '../../../src/use_case/createUseCase/createUseCaseOutputBoundary.js';
import { CreateUseCaseOutputData } from '../../../src/use_case/createUseCase/createUseCaseOutputData.js';
import { makeMockFileAccess } from '../doubles/mock-file-access.js';

describe('CreateUseCaseInteractor', () => {
  let mockFileAccess: jest.Mocked<FileAccessInterface>;
  let mockPresenter: jest.Mocked<CreateUseCaseOutputBoundary>;
  let outputData: CreateUseCaseOutputData;

  beforeEach(() => {
    mockFileAccess = makeMockFileAccess();

    mockPresenter = {
      showSuccessView:
        jest.fn<CreateUseCaseOutputBoundary['showSuccessView']>(),
      showFailView: jest.fn<CreateUseCaseOutputBoundary['showFailView']>(),
    };

    outputData = new CreateUseCaseOutputData();
  });

  function runInteractor(name: string) {
    const interactor = new CreateUseCaseInteractor(
      mockFileAccess,
      mockPresenter,
      outputData
    );
    return interactor.execute(new CreateUseCaseInputData(name));
  }

  // TODO: Add a separate test case checking if use case names with spaces wer properly sanitized

  it('successfully creates directories and files for a valid use case name in java', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('root/src/java');
    mockFileAccess.bfsFindDir.mockImplementation(
      async (path, dirName) => `/root/src/${dirName}`
    );

    // Act
    await runInteractor('LoginUser');

    // Assert
    // Verify directory creation
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/use_case/LoginUser'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/interface_adapter/LoginUser'
    );

    // Verify key files were created
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserInputBoundary.java')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserUseCaseInteractor.java')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserController.java')
    );

    // Verify success signal
    expect(outputData.getUseCase()).toBe('LoginUser');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('successfully creates directories and files for a valid use case name in python', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('root/src/python');
    mockFileAccess.bfsFindDir.mockImplementation(
      async (path, dirName) => `/root/src/${dirName}`
    );

    // Act
    await runInteractor('LoginUser');

    // Assert
    // Verify directory creation
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/use_case/LoginUser'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/interface_adapter/LoginUser'
    );

    // Verify key files were created
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserInputBoundary.py')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserUseCaseInteractor.py')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserController.py')
    );

    // Verify success signal
    expect(outputData.getUseCase()).toBe('LoginUser');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('successfully creates directories and files for a valid use case name in javascript', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('root/src/javascript');
    mockFileAccess.bfsFindDir.mockImplementation(
      async (path, dirName) => `/root/src/${dirName}`
    );

    // Act
    await runInteractor('LoginUser');

    // Assert
    // Verify directory creation
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/use_case/LoginUser'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/interface_adapter/LoginUser'
    );

    // Verify key files were created
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserInputBoundary.js')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserUseCaseInteractor.js')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserController.js')
    );

    // Verify success signal
    expect(outputData.getUseCase()).toBe('LoginUser');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('successfully creates directories and files for a valid use case name in typescript', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('root/src/typescript');
    mockFileAccess.bfsFindDir.mockImplementation(
      async (path, dirName) => `/root/src/${dirName}`
    );

    // Act
    await runInteractor('LoginUser');

    // Assert
    // Verify directory creation
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/use_case/LoginUser'
    );
    expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(
      '/root/src/interface_adapter/LoginUser'
    );

    // Verify key files were created
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserInputBoundary.ts')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserUseCaseInteractor.ts')
    );
    expect(mockFileAccess.createFile).toHaveBeenCalledWith(
      expect.stringContaining('LoginUserController.ts')
    );

    // Verify success signal
    expect(outputData.getUseCase()).toBe('LoginUser');
    expect(mockPresenter.showSuccessView).toHaveBeenCalled();
    expect(mockPresenter.showFailView).not.toHaveBeenCalled();
  });

  it('fails and sets output data to false if directories are not found', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    // Simulate missing directory
    mockFileAccess.bfsFindDir.mockResolvedValue(null);

    // Act
    await runInteractor('Test');

    // Assert
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'Could not find use_case or interface_adapter, try initiating project first.'
    );
    // Ensure no files were attempted to be created
    expect(mockFileAccess.createFile).not.toHaveBeenCalled();
  });

  it('fails and sets output data to false if directories are already present', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir.mockResolvedValueOnce('/root/src/python');
    mockFileAccess.bfsFindDir.mockImplementation(
      async (path, dirName) => `/root/src/${dirName}`
    );
    // Simulate already existing directory
    mockFileAccess.exists.mockResolvedValue(true);

    // Act
    await runInteractor('Test');

    // Assert
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalledWith(
      'Usecase Test already exists. Please choose a different name.'
    );
    // Ensure no files or directories were attempted to be created
    expect(mockFileAccess.createFile).not.toHaveBeenCalled();
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });

  it('fails if an unexpected error occurs during file creation', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce('/root/src/python')
      .mockResolvedValueOnce('/root/dir');
    mockFileAccess.createFile.mockRejectedValue(new Error('Disk Full'));

    // Act
    await runInteractor('Test');

    // Assert
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });

  it('fails if there is no programming language directory', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue('/root');
    mockFileAccess.bfsFindDir
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    // Act
    await runInteractor('Test');

    // Assert
    expect(mockPresenter.showSuccessView).not.toHaveBeenCalled();
    expect(mockPresenter.showFailView).toHaveBeenCalled();
  });
});
