import chalk from 'chalk';
import express from 'express';
import * as fs from 'fs';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ViteDevServer } from 'vite';

import type { JavaParserCliAccessInterface } from '../data_access/JavaParserCliAccessInterface.js';
import type { SessionDBAccessInterface } from '../data_access/sessionDBAccessInterface.js';
import { createAnalysisRouter } from './routes/analysis.js';
import { createDesignPatternRouter } from './routes/designPatterns.js';
import template from './routes/template.js';

let server: Server | null = null;
let viteServer: ViteDevServer | null = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPathFromSource = path.resolve(__dirname, '../../frontend');
const frontendPathFromDist = path.resolve(__dirname, '../../../frontend');
const FRONTEND_DIR = fs.existsSync(frontendPathFromSource)
  ? frontendPathFromSource
  : frontendPathFromDist;

const isProd = process.env.NODE_ENV !== 'development';

export async function startServer(
  backendOnly: boolean,
  db: SessionDBAccessInterface,
  javaParserCliAccess: JavaParserCliAccessInterface
): Promise<Server> {
  const app = express();

  app.use(express.json());

  // Routes
  app.use('/api', createAnalysisRouter(db));
  app.use('/api', template);
  app.use('/api', createDesignPatternRouter(javaParserCliAccess));

  // Create Vite server in middleware mode
  if (!backendOnly) {
    try {
      if (isProd) {
        const distDir = path.join(FRONTEND_DIR, 'dist');
        app.use(express.static(distDir));
        app.get('/{*splat}', (_req, res) => {
          res.sendFile(path.join(distDir, 'index.html'));
        });
      } else {
        const { createServer: createViteServer } = await import('vite');
        viteServer = await createViteServer({
          root: FRONTEND_DIR,
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(viteServer.middlewares);
      }
    } catch (err) {
      throw new Error(`Failed to start Vite frontend from ${FRONTEND_DIR}`, {
        cause: err,
      });
    }
  }

  return new Promise((resolve, reject) => {
    const localServer = app.listen(0, () => {
      const { port } = localServer.address() as AddressInfo;

      console.log(chalk.green(`Server running at http://localhost:${port}`));

      if (!backendOnly) {
        console.log(
          chalk.dim(
            `  → Frontend served via ${isProd ? 'static build' : 'Vite middleware'}`
          )
        );
        console.log(chalk.dim(`  → Session API at /api/session`));
      }

      server = localServer;
      resolve(localServer);
    });

    // 4. Catch initialization errors
    localServer.once('error', reject);
  });
}

export async function stopServer() {
  await viteServer?.close();
  viteServer = null;

  return new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        server = null;
        resolve();
      }
    });
  });
}
