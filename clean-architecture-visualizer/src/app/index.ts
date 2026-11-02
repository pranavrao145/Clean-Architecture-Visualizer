#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

import { CleanArchAccess } from '../data_access/cleanArchInfoAccess.js';
import { FileAccess } from '../data_access/fileAccess.js';
import { JavaParserCliAccess } from '../data_access/JavaParserCliAccess.js';
import { PatternsAccess } from '../data_access/PatternsAccess.js';
import { SessionDBAccess } from '../data_access/sessionDBAccess.js';
import { CommonCodebaseASGFactory } from '../entity/CommonCodebaseASGFactory.js';
import { CommonPatternFactory } from '../entity/CommonPatternFactory.js';
import { AppBuilder } from './appBuilder.js';

const program = new Command();

const app = new AppBuilder()
  .withFileAccess(new FileAccess())
  .withCleanArchAccess(new CleanArchAccess())
  .withSessionDBAccess(new SessionDBAccess())
  .withJavaParserCliAccess(
    new JavaParserCliAccess(new CommonCodebaseASGFactory())
  )
  .withPatternsAccess(new PatternsAccess(new CommonPatternFactory()));

program.version(packageJson.version);

program
  .command('start')
  .description('Start backend server and frontend dev server')
  .option('--backend-only', 'Start only the backend server', false)
  .action(async (options) => {
    await app.runStart(options.backendOnly);
  });

program
  .command('verify')
  .description(
    'Verify whether the use cases found in child directories adhere to Clean Architeccture'
  )
  .action(async () => {
    await app.runCLIGraphVerification();
  });

program
  .command('init [language]')
  .description('Create the template for a new CSC207 project')
  .action(async (language: string = 'java') => {
    await app.runInitProject(language);
  });

program
  .command('module_init [language]')
  .description(
    'Create the template for a new CSC207 project, packaged by module.'
  )
  .action(async (language: string = 'java') => {
    await app.runInitModuleProject(language);
  });

program
  .command('usecase <name>')
  .description('Create the template for a new use case')
  .action(async (name: string) => {
    await app.runCreateUseCase(name);
  });

program
  .command('module_usecase <feature> <usecase>')
  .description('Add a new use case to a specified feature.')
  .action(async (feature: string, usecase: string) => {
    await app.runCreateModuleUseCase(feature, usecase);
  });

program
  .command('feature <feature>')
  .description('Add a new feature to the directory of features.')
  .action(async (feature: string) => {
    await app.runCreateFeature(feature);
  });

program
  .command('end')
  .description('Close the express server and clean the tempdir')
  .action(async () => {
    await app.runEndProject();
  });

program.parse(process.argv);
