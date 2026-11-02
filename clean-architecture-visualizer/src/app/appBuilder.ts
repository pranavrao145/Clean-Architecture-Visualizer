import chalk from 'chalk';
import type { CleanArchAccess } from '../data_access/cleanArchInfoAccess.js';
import type { FileAccess } from '../data_access/fileAccess.js';
import type { JavaParserCliAccess } from '../data_access/JavaParserCliAccess.js';
import type { PatternsAccessInterface } from '../data_access/PatternsAccessInterface.js';
import type { SessionDBAccess } from '../data_access/sessionDBAccess.js';
import { CreateModuleUseCaseController } from '../interface_adapter/CreateModuleUseCase/createModuleUseCaseController.js';
import { CreateModuleUseCasePresenter } from '../interface_adapter/CreateModuleUseCase/createModuleUseCasePresenter.js';
import { CreateFeatureController } from '../interface_adapter/createFeature/createFeatureController.js';
import { CreateFeaturePresenter } from '../interface_adapter/createFeature/createFeaturePresenter.js';
import { CreateUseCaseController } from '../interface_adapter/createUseCase/createUseCaseController.js';
import { CreateUseCasePresenter } from '../interface_adapter/createUseCase/createUseCasePresenter.js';
import { GraphVerificationController } from '../interface_adapter/graphVerification/graphVerificationController.js';
import { GraphVerificationPresenter } from '../interface_adapter/graphVerification/graphVerificationPresenter.js';
import { InitModuleProjectController } from '../interface_adapter/initModuleProject/initModuleProjectController.js';
import { InitProjectController } from '../interface_adapter/initProject/initProjectController.js';
import { stopServer } from '../server/server.js';
import { startCommand } from '../server/startCommand.js';
import { CreateFeatureInputData } from '../use_case/createFeature/createFeatureInputData.js';
import { CreateFeatureInteractor } from '../use_case/createFeature/createFeatureInteractor.js';
import { CreateFeatureOutputData } from '../use_case/createFeature/createFeatureOutputData.js';
import { CreateModuleUseCaseInputData } from '../use_case/createModuleUseCase/createModuleUseCaseInputData.js';
import { CreateModuleUseCaseInteractor } from '../use_case/createModuleUseCase/createModuleUseCaseInteractor.js';
import { CreateModuleUseCaseOutputData } from '../use_case/createModuleUseCase/createModuleUseCaseOutputData.js';
import { CreateUseCaseInputData } from '../use_case/createUseCase/createUseCaseInputData.js';
import { CreateUseCaseInteractor } from '../use_case/createUseCase/createUseCaseInteractor.js';
import { CreateUseCaseOutputData } from '../use_case/createUseCase/createUseCaseOutputData.js';
import { GraphVerificationInputData } from '../use_case/graphVerification/graphVerificationInputData.js';
import { GraphVerificationInteractor } from '../use_case/graphVerification/graphVerificationInteractor.js';
import { GraphVerificationOutputData } from '../use_case/graphVerification/graphVerificationOutputData.js';
import { InitModuleProjectInputData } from '../use_case/initModuleProject/initModuleProjectInputData.js';
import { InitModuleProjectInteractor } from '../use_case/initModuleProject/initModuleProjectInteractor.js';
import { InitModuleProjectOutputData } from '../use_case/initModuleProject/initModuleProjectOutputData.js';
import { InitProjectInputData } from '../use_case/initProject/initProjectInputData.js';
import { InitProjectInteractor } from '../use_case/initProject/initProjectInteractor.js';
import { InitProjectOutputData } from '../use_case/initProject/initProjectOutputData.js';

export class AppBuilder {
  private fileAccess?: FileAccess;
  private cleanArchAccess?: CleanArchAccess;
  private db?: SessionDBAccess;
  private javaParserCliAccess?: JavaParserCliAccess;
  private patternsAccess?: PatternsAccessInterface;

  withFileAccess(fileAccess: FileAccess): this {
    this.fileAccess = fileAccess;
    return this;
  }

  withCleanArchAccess(access: CleanArchAccess): this {
    this.cleanArchAccess = access;
    return this;
  }

  withSessionDBAccess(db: SessionDBAccess): this {
    this.db = db;
    return this;
  }

  withJavaParserCliAccess(javaParserCliAccess: JavaParserCliAccess): this {
    this.javaParserCliAccess = javaParserCliAccess;
    return this;
  }

  withPatternsAccess(patternsAccess: PatternsAccessInterface): this {
    this.patternsAccess = patternsAccess;
    return this;
  }

  private requireDeps() {
    if (
      !this.fileAccess ||
      !this.cleanArchAccess ||
      !this.db ||
      !this.javaParserCliAccess ||
      !this.patternsAccess
    ) {
      throw new Error(
        'FileAccess, CleanArchAccess, SessionDBAccess, JavaParserCliAccess, and PatternsAccess must be set'
      );
    }
    return {
      fileAccess: this.fileAccess,
      cleanArchAccess: this.cleanArchAccess,
      db: this.db,
      javaParserCliAccess: this.javaParserCliAccess,
      patternsAccess: this.patternsAccess,
    };
  }

  async runGraphVerification(): Promise<void> {
    const { fileAccess, cleanArchAccess, db } = this.requireDeps();
    const inputData = new GraphVerificationInputData(false);
    const outputData = new GraphVerificationOutputData();
    const presenter = new GraphVerificationPresenter(outputData);
    const interactor = new GraphVerificationInteractor(
      fileAccess,
      cleanArchAccess,
      db,
      presenter,
      [],
      outputData,
      inputData
    );
    await new GraphVerificationController(interactor).execute();
  }

  /**
   * Analyse the project, then serve the results. The server reads from the
   * same session DB that verification just populated.
   */
  async runStart(backendOnly: boolean): Promise<void> {
    const { db, javaParserCliAccess } = this.requireDeps();
    await this.runGraphVerification();
    await startCommand({ backendOnly, db, javaParserCliAccess });
  }

  async runCLIGraphVerification(): Promise<void> {
    const { fileAccess, cleanArchAccess, db } = this.requireDeps();
    const inputData = new GraphVerificationInputData(true);
    const outputData = new GraphVerificationOutputData();
    const presenter = new GraphVerificationPresenter(outputData);
    const interactor = new GraphVerificationInteractor(
      fileAccess,
      cleanArchAccess,
      db,
      presenter,
      [],
      outputData,
      inputData
    );
    await new GraphVerificationController(interactor).execute();
  }

  async runInitProject(language: string): Promise<void> {
    const inputData = new InitProjectInputData(language);
    const outputData = new InitProjectOutputData();
    const interactor = new InitProjectInteractor(
      this.fileAccess!,
      inputData,
      outputData
    );
    await new InitProjectController(interactor).execute();

    if (outputData.getOutputData()) {
      console.log(chalk.green('Your project has been initialized.'));
    } else {
      console.log(
        chalk.red(
          'An error occurred and your project has not been initialized.'
        )
      );
    }
  }

  async runInitModuleProject(language: string): Promise<void> {
    const inputData = new InitModuleProjectInputData(language);
    const outputData = new InitModuleProjectOutputData();
    const interactor = new InitModuleProjectInteractor(
      this.fileAccess!,
      inputData,
      outputData
    );
    await new InitModuleProjectController(interactor).execute();

    if (outputData.getOutputData()) {
      console.log(
        chalk.green('Your project packaged by module has been initialized.')
      );
    } else {
      console.log(
        chalk.red(
          'An error occurred and your project packaged by module has not been initialized.'
        )
      );
    }
  }

  async runCreateUseCase(name: string): Promise<void> {
    const inputData = new CreateUseCaseInputData(name);
    const outputData = new CreateUseCaseOutputData();
    const presenter = new CreateUseCasePresenter(outputData);
    const interactor = new CreateUseCaseInteractor(
      this.fileAccess!,
      presenter,
      inputData,
      outputData
    );
    await new CreateUseCaseController(interactor).execute();
  }

  async runCreateFeature(feature: string): Promise<void> {
    const inputData = new CreateFeatureInputData(feature);
    const outputData = new CreateFeatureOutputData();
    const presenter = new CreateFeaturePresenter(outputData);
    const interactor = new CreateFeatureInteractor(
      this.fileAccess!,
      presenter,
      inputData,
      outputData
    );
    await new CreateFeatureController(interactor).execute();
  }

  async runCreateModuleUseCase(feature: string, name: string): Promise<void> {
    const inputData = new CreateModuleUseCaseInputData(feature, name);
    const outputData = new CreateModuleUseCaseOutputData();
    const presenter = new CreateModuleUseCasePresenter(outputData);
    const interactor = new CreateModuleUseCaseInteractor(
      this.fileAccess!,
      presenter,
      inputData,
      outputData
    );
    await new CreateModuleUseCaseController(interactor).execute();
  }

  async runEndProject(): Promise<void> {
    this.db?.resetDB();
    await stopServer();
  }
}
