import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FileAccessInterface } from '../../../src/data_access/fileAccessInterface.js';
import { InitProjectInputData } from '../../../src/use_case/initProject/initProjectInputData.js';
import { InitProjectInteractor } from '../../../src/use_case/initProject/initProjectInteractor.js';
import { InitProjectOutputData } from '../../../src/use_case/initProject/initProjectOutputData.js';
import { makeMockFileAccess } from '../doubles/mock-file-access.js';

describe('InitProjectInteractor', () => {
  let mockFileAccess: jest.Mocked<FileAccessInterface>;
  let mockOutputData: InitProjectOutputData;

  const ROOT_PATH = '/project/root';

  beforeEach(() => {
    // Setup Mocks
    mockFileAccess = makeMockFileAccess();

    mockOutputData = new InitProjectOutputData();
    jest.spyOn(mockOutputData, 'setOutputData');
  });

  function runInteractor(language: string) {
    const interactor = new InitProjectInteractor(
      mockFileAccess,
      mockOutputData
    );
    return interactor.execute(new InitProjectInputData(language));
  }

  it('successfully creates the entire Clean Architecture directory structure in java', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);

    // Act
    await runInteractor('java');

    // Assert
    const expectedDirs = [
      `${ROOT_PATH}/src/main/java`,
      `${ROOT_PATH}/src/test/java`,
      `${ROOT_PATH}/src/main/java/app`,
      `${ROOT_PATH}/src/main/java/use_case`,
      `${ROOT_PATH}/src/main/java/entity`,
      `${ROOT_PATH}/src/main/java/interface_adapter`,
      `${ROOT_PATH}/src/main/java/data_access`,
      `${ROOT_PATH}/src/main/java/database`,
      `${ROOT_PATH}/src/main/java/view`,
    ];

    // Check that each directory was called
    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    // Verify total number of calls matches the number of directories
    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    // Verify success signal
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('successfully creates the entire Clean Architecture directory structure in python', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);

    // Act
    await runInteractor('python');

    // Assert
    const expectedDirs = [
      `${ROOT_PATH}/src/main/python`,
      `${ROOT_PATH}/src/test/python`,
      `${ROOT_PATH}/src/main/python/app`,
      `${ROOT_PATH}/src/main/python/use_case`,
      `${ROOT_PATH}/src/main/python/entity`,
      `${ROOT_PATH}/src/main/python/interface_adapter`,
      `${ROOT_PATH}/src/main/python/data_access`,
      `${ROOT_PATH}/src/main/python/database`,
      `${ROOT_PATH}/src/main/python/view`,
    ];

    // Check that each directory was called
    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    // Verify total number of calls matches the number of directories
    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    // Verify success signal
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('successfully creates the entire Clean Architecture directory structure in javascript', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);

    // Act
    await runInteractor('Javascript');

    // Assert
    const expectedDirs = [
      `${ROOT_PATH}/src/main/javascript`,
      `${ROOT_PATH}/src/test/javascript`,
      `${ROOT_PATH}/src/main/javascript/app`,
      `${ROOT_PATH}/src/main/javascript/use_case`,
      `${ROOT_PATH}/src/main/javascript/entity`,
      `${ROOT_PATH}/src/main/javascript/interface_adapter`,
      `${ROOT_PATH}/src/main/javascript/data_access`,
      `${ROOT_PATH}/src/main/javascript/database`,
      `${ROOT_PATH}/src/main/javascript/view`,
    ];

    // Check that each directory was called
    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    // Verify total number of calls matches the number of directories
    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    // Verify success signal
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('successfully creates the entire Clean Architecture directory structure in typescript', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);

    // Act
    await runInteractor('typescript');

    // Assert
    const expectedDirs = [
      `${ROOT_PATH}/src/main/typescript`,
      `${ROOT_PATH}/src/test/typescript`,
      `${ROOT_PATH}/src/main/typescript/app`,
      `${ROOT_PATH}/src/main/typescript/use_case`,
      `${ROOT_PATH}/src/main/typescript/entity`,
      `${ROOT_PATH}/src/main/typescript/interface_adapter`,
      `${ROOT_PATH}/src/main/typescript/data_access`,
      `${ROOT_PATH}/src/main/typescript/database`,
      `${ROOT_PATH}/src/main/typescript/view`,
    ];

    // Check that each directory was called
    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    // Verify total number of calls matches the number of directories
    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    // Verify success signal
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('sets output data to false if the file system fails', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    // Force an error on one of the directory creations
    mockFileAccess.createDirectory.mockRejectedValue(
      new Error('Permission denied')
    );

    // Act
    await runInteractor('java');

    // Assert
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });

  it('correctly handles errors if getCurrentPath fails', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockRejectedValue(new Error('Path unknown'));

    // Act
    await runInteractor('java');

    // Assert
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });

  it('should fail if already initialized', async () => {
    // Arrange
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);
    mockFileAccess.bfsFindDir.mockResolvedValue(`${ROOT_PATH}/src/main`);

    // Act
    await runInteractor('java');

    // Assert
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });

  it('Error occurs because src directory does not exist.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(false);
    await runInteractor('java');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });

  it('Error occurs because programming language is invalid..', async () => {
    await runInteractor('blah blah blah');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });
});
