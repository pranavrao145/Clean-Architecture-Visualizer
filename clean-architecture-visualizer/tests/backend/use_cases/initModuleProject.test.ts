import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { FileAccessInterface } from '../../../src/data_access/fileAccessInterface.js';
import { InitModuleProjectInputData } from '../../../src/use_case/initModuleProject/initModuleProjectInputData.js';
import { InitModuleProjectInteractor } from '../../../src/use_case/initModuleProject/initModuleProjectInteractor.js';
import { InitModuleProjectOutputData } from '../../../src/use_case/initModuleProject/initModuleProjectOutputData.js';
import { makeMockFileAccess } from '../doubles/mock-file-access.js';

describe('InitModuleProjectInteractor', () => {
  let mockFileAccess: jest.Mocked<FileAccessInterface>;
  let mockOutputData: InitModuleProjectOutputData;

  const ROOT_PATH = '/project/root';
  beforeEach(() => {
    // Not testing file access, so we give mock values and implementations
    mockFileAccess = makeMockFileAccess();

    mockOutputData = new InitModuleProjectOutputData();
    jest.spyOn(mockOutputData, 'setOutputData');
  });

  function runInteractor(language: string) {
    const interactor = new InitModuleProjectInteractor(
      mockFileAccess,
      mockOutputData
    );
    return interactor.execute(new InitModuleProjectInputData(language));
  }

  it('Creates CA directory that is packaged by module (src exists) in java.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);
    await runInteractor('Java');

    const expectedDirs = [
      `${ROOT_PATH}/src/main/java`,
      `${ROOT_PATH}/src/test/java`,
      `${ROOT_PATH}/src/main/java/features`,
      `${ROOT_PATH}/src/main/java/data_access`,
      `${ROOT_PATH}/src/main/java/entity`,
      `${ROOT_PATH}/src/main/java/app`,
      `${ROOT_PATH}/src/main/java/views`,
      `${ROOT_PATH}/src/main/java/database`,
    ];

    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('Creates CA directory that is packaged by module (src exists) in python.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);
    await runInteractor('python');

    const expectedDirs = [
      `${ROOT_PATH}/src/main/python`,
      `${ROOT_PATH}/src/test/python`,
      `${ROOT_PATH}/src/main/python/features`,
      `${ROOT_PATH}/src/main/python/data_access`,
      `${ROOT_PATH}/src/main/python/entity`,
      `${ROOT_PATH}/src/main/python/app`,
      `${ROOT_PATH}/src/main/python/views`,
      `${ROOT_PATH}/src/main/python/database`,
    ];

    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('Creates CA directory that is packaged by module (src exists) in javascript.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);
    await runInteractor('javascript');

    const expectedDirs = [
      `${ROOT_PATH}/src/main/javascript`,
      `${ROOT_PATH}/src/test/javascript`,
      `${ROOT_PATH}/src/main/javascript/features`,
      `${ROOT_PATH}/src/main/javascript/data_access`,
      `${ROOT_PATH}/src/main/javascript/entity`,
      `${ROOT_PATH}/src/main/javascript/app`,
      `${ROOT_PATH}/src/main/javascript/views`,
      `${ROOT_PATH}/src/main/javascript/database`,
    ];

    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('Creates CA directory that is packaged by module (src exists) in typescript.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(true);
    await runInteractor('typescript');

    const expectedDirs = [
      `${ROOT_PATH}/src/main/typescript`,
      `${ROOT_PATH}/src/test/typescript`,
      `${ROOT_PATH}/src/main/typescript/features`,
      `${ROOT_PATH}/src/main/typescript/data_access`,
      `${ROOT_PATH}/src/main/typescript/entity`,
      `${ROOT_PATH}/src/main/typescript/app`,
      `${ROOT_PATH}/src/main/typescript/views`,
      `${ROOT_PATH}/src/main/typescript/database`,
    ];

    expectedDirs.forEach((dir) => {
      expect(mockFileAccess.createDirectory).toHaveBeenCalledWith(dir);
    });

    expect(mockFileAccess.createDirectory).toHaveBeenCalledTimes(
      expectedDirs.length
    );

    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(true);
  });

  it('Error occurs because the programming language is invalid.', async () => {
    await runInteractor('blah blah blah');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });

  it('Error occurs because src directory does not exist.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.exists.mockResolvedValue(false);
    await runInteractor('java');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });

  it('Sets output to false if the file system fails.', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.createDirectory.mockRejectedValue(
      new Error('Permission denied')
    );

    await runInteractor('java');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
  });

  it('Handles errors if getCurrentPath fails.', async () => {
    mockFileAccess.getCurrentPath.mockRejectedValue(new Error('Path unknown'));
    await runInteractor('java');

    // Assert
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });

  it('Sets output to false if main directory exists (project already initialized).', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.bfsFindDir.mockResolvedValue(`${ROOT_PATH}/src/main`);
    mockFileAccess.exists.mockResolvedValue(true);

    await runInteractor('java');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });

  it('Sets output to false if test directory exists (project already initialized).', async () => {
    mockFileAccess.getCurrentPath.mockResolvedValue(ROOT_PATH);
    mockFileAccess.bfsFindDir.mockResolvedValue(`${ROOT_PATH}/src/test`);
    mockFileAccess.exists.mockResolvedValue(true);

    await runInteractor('java');
    expect(mockOutputData.setOutputData).toHaveBeenCalledWith(false);
    expect(mockFileAccess.createDirectory).not.toHaveBeenCalled();
  });
});
