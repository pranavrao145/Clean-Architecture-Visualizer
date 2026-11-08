import path from 'path';
import type { FileAccessInterface } from '../../data_access/fileAccessInterface.js';
import type { InitModuleProjectInputBoundary } from './initModuleProjectInputBoundary.js';
import type { InitModuleProjectInputData } from './initModuleProjectInputData.js';
import { InitModuleProjectOutputData } from './initModuleProjectOutputData.js';

export class InitModuleProjectInteractor
  implements InitModuleProjectInputBoundary
{
  private readonly fileAccess: FileAccessInterface;
  private readonly outputData: InitModuleProjectOutputData;

  constructor(
    fileAccess: FileAccessInterface,
    outputData: InitModuleProjectOutputData = new InitModuleProjectOutputData()
  ) {
    this.fileAccess = fileAccess;
    this.outputData = outputData;
  }

  async execute(inputData: InitModuleProjectInputData): Promise<void> {
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
      // Create the src directory if it does not exist.
      const res = await this.fileAccess.exists(currPath);
      if (!res) {
        throw new Error('You need to create the src directory first.');
      }
      // If main or test already exist, there is a chance the project has already been initialized
      if (
        (await this.fileAccess.bfsFindDir(currPath, 'main')) ||
        (await this.fileAccess.bfsFindDir(currPath, 'test'))
      ) {
        throw new Error('project already initialized.');
      }

      // The project does support TS, JS, Python, and Java
      const programmingPath = path.join(
        currPath,
        'main',
        language.toLowerCase()
      );
      const testPath = path.join(currPath, 'test', language.toLowerCase());
      await this.fileAccess.createDirectory(programmingPath);
      await this.fileAccess.createDirectory(testPath);

      // Create code structure for packaging by module.
      const subDirectories = [
        'features',
        'data_access',
        'entity',
        'app',
        'views',
        'database',
      ];
      for (const directoryName of subDirectories) {
        await this.fileAccess.createDirectory(
          path.join(programmingPath, directoryName)
        );
      }

      this.outputData.setOutputData(true);
    } catch (error) {
      console.error('Initialization failed:', error);
      this.outputData.setOutputData(false);
    }
  }
}
