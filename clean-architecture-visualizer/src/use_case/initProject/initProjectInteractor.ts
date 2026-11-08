import path from 'path';
import type { FileAccessInterface } from '../../data_access/fileAccessInterface.js';
import type { InitProjectInputBoundary } from './initProjectInputBoundary.js';
import type { InitProjectInputData } from './initProjectInputData.js';
import { InitProjectOutputData } from './initProjectOutputData.js';

export class InitProjectInteractor implements InitProjectInputBoundary {
  private readonly fileAccess: FileAccessInterface;
  private readonly outputData: InitProjectOutputData;

  constructor(
    fileAccess: FileAccessInterface,
    outputData: InitProjectOutputData = new InitProjectOutputData()
  ) {
    this.fileAccess = fileAccess;
    this.outputData = outputData;
  }

  async execute(inputData: InitProjectInputData): Promise<void> {
    try {
      const acceptedLanguage = ['typescript', 'javascript', 'java', 'python'];
      const language = inputData.getLanguage().trim();
      if (!acceptedLanguage.includes(language.toLowerCase())) {
        throw new Error(
          'You must enter a valid programming language of: java, python, typescript, or javascript. Blank defaults to Java.'
        );
      }

      let currPath = await this.fileAccess.getCurrentPath();
      currPath = path.join(currPath, 'src');
      const res = await this.fileAccess.exists(currPath);
      if (!res) {
        throw new Error('You need to create the src directory first.');
      }

      // 0. If main or test already exist, there is a chance the project has already been initialized
      if (
        (await this.fileAccess.bfsFindDir(currPath, 'main')) ||
        (await this.fileAccess.bfsFindDir(currPath, 'test'))
      ) {
        throw new Error('project already initialized.');
      }

      // 1. Define base paths using path.join for cross-platform support
      const programmingPath = path.join(
        currPath,
        'main',
        language.toLowerCase()
      );
      const testPath = path.join(currPath, 'test', language.toLowerCase());

      // 2. Define sub-directories within the java path
      const subDirs = [
        'app',
        'use_case',
        'entity',
        'interface_adapter',
        'data_access',
        'view',
        'database',
      ];

      await this.fileAccess.createDirectory(programmingPath);
      await this.fileAccess.createDirectory(testPath);

      for (const dirName of subDirs) {
        const fullPath = path.join(programmingPath, dirName);
        await this.fileAccess.createDirectory(fullPath);
      }

      this.outputData.setOutputData(true);
    } catch (error) {
      console.error('Initialization failed:', error);
      this.outputData.setOutputData(false);
    }
  }
}
