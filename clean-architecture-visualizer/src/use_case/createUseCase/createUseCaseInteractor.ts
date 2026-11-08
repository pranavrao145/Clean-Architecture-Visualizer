import path from 'node:path';
import type { FileAccessInterface } from '../../data_access/fileAccessInterface.js';
import type { CreateUseCaseInputBoundary } from './createUseCaseInputBoundary.js';
import type { CreateUseCaseInputData } from './createUseCaseInputData.js';
import type { CreateUseCaseOutputBoundary } from './createUseCaseOutputBoundary.js';
import type { CreateUseCaseOutputData } from './createUseCaseOutputData.js';

export class CreateUseCaseInteractor implements CreateUseCaseInputBoundary {
  constructor(
    private readonly fileAccess: FileAccessInterface,
    private readonly presenter: CreateUseCaseOutputBoundary,
    private readonly outputData: CreateUseCaseOutputData
  ) {}

  async execute(inputData: CreateUseCaseInputData): Promise<void> {
    try {
      const useCaseName = inputData.getUseCaseName().split(' ').join('');
      const currPath = await this.fileAccess.getCurrentPath();

      // Find the language directory -- makes assumption only one directory is named after language
      let extension: string | undefined;
      const languageToExtension = new Map<string, string>([
        ['python', 'py'],
        ['java', 'java'],
        ['javascript', 'js'],
        ['typescript', 'ts'],
      ]);
      for (const [language, ext] of languageToExtension) {
        if (await this.fileAccess.bfsFindDir(currPath, language)) {
          extension = ext;
          break;
        }
      }

      if (extension === undefined) {
        this.presenter.showFailView(
          'Your project does not have a specified programming language. You must create a directory that has the name: java, python, typescript, or javascript.'
        );
        return;
      }

      // Find base directories
      const useCaseDir = await this.fileAccess.bfsFindDir(currPath, 'use_case');
      const interfaceAdapterDir = await this.fileAccess.bfsFindDir(
        currPath,
        'interface_adapter'
      );

      if (!useCaseDir || !interfaceAdapterDir) {
        this.presenter.showFailView(
          'Could not find use_case or interface_adapter, try initiating project first.'
        );
        return;
      }

      const targetUseCasePath = path.join(useCaseDir, useCaseName);
      const targetInterfacePath = path.join(interfaceAdapterDir, useCaseName);

      // Check if files already exist
      const useCaseExists = await this.fileAccess.exists(targetUseCasePath);
      const interfaceExists = await this.fileAccess.exists(targetInterfacePath);
      if (useCaseExists || interfaceExists) {
        this.presenter.showFailView(
          `Usecase ${useCaseName} already exists. Please choose a different name.`
        );
        return;
      }

      // Create use case
      await this.fileAccess.createDirectory(targetUseCasePath);
      await this.fileAccess.createDirectory(targetInterfacePath);

      const createFile = async (dir: string, suffix: string) => {
        const fileName = `${useCaseName}${suffix}.${extension}`;
        const fullPath = path.join(dir, fileName);
        return await this.fileAccess.createFile(fullPath);
      };

      // Use Case Layer Files
      await createFile(targetUseCasePath, 'InputBoundary');
      await createFile(targetUseCasePath, 'InputData');
      await createFile(targetUseCasePath, 'UseCaseInteractor');
      await createFile(targetUseCasePath, 'OutputData');
      await createFile(targetUseCasePath, 'OutputBoundary');

      // Interface Adapter Layer Files
      await createFile(targetInterfacePath, 'Controller');
      await createFile(targetInterfacePath, 'Presenter');

      this.outputData.setUseCase(useCaseName);
      this.presenter.showSuccessView();
    } catch (error) {
      if (error instanceof Error) {
        this.presenter.showFailView(error.message);
      }
    }
  }
}
