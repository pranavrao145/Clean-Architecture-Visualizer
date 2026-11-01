import chalk from 'chalk';
import { exec } from 'child_process';
import type { AddressInfo } from 'net';

import type { JavaParserCliAccessInterface } from '../data_access/JavaParserCliAccessInterface.js';
import type { SessionDBAccessInterface } from '../data_access/sessionDBAccessInterface.js';
import { startServer, stopServer } from './server.js';

export async function startCommand(options: {
  backendOnly: boolean;
  db: SessionDBAccessInterface;
  javaParserCliAccess: JavaParserCliAccessInterface;
}): Promise<void> {
  const devServer = await startServer(
    options.backendOnly,
    options.db,
    options.javaParserCliAccess
  );
  const { port } = devServer.address() as AddressInfo;

  let shutdownStarted = false;
  const shutdown = async (signal: string) => {
    if (shutdownStarted) return;
    shutdownStarted = true;

    console.log(chalk.dim(`\nReceived ${signal}. Shutting down...`));

    const forceExitTimer = setTimeout(() => {
      process.exit(1);
    }, 3000);

    try {
      await stopServer();
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (err) {
      console.error(chalk.red('Error during clean shutdown:'), err);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  if (!options.backendOnly) {
    const openCommand =
      process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'cmd /c start ""'
          : 'xdg-open';
    const appUrl = `http://localhost:${port}`;

    setTimeout(() => {
      if (!shutdownStarted) {
        exec(`${openCommand} "${appUrl}"`, (error) => {
          if (error) {
            console.warn(
              chalk.yellow('Could not open browser. Visit manually:'),
              appUrl
            );
          } else {
            console.log(chalk.green('App opened at'), appUrl);
          }
        });
      }
    }, 1000);
  }
}
