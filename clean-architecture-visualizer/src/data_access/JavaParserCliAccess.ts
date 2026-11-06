import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CodebaseASG } from "../entity/CodebaseASG.js";
import type { CodebaseASGNode } from "../types/codebaseASGNodes.js";
import type { CodebaseASGEdge } from "../types/codebaseASGEdges.js";
import type { JavaParserCliAccessInterface } from "./JavaParserCliAccessInterface.js";
import type { CodebaseASGFactory } from "../entity/CodebaseASGFactory.js";

const JAR_NAME = "javaparser-cli-1.0-SNAPSHOT-all.jar";
const MAX_OUTPUT_BYTES = 512 * 1024 * 1024;

type RawOutput = {
  nodes: CodebaseASGNode[];
  edges: CodebaseASGEdge[];
};

export class JavaParserCliAccess implements JavaParserCliAccessInterface {
  private readonly codebaseASGFactory: CodebaseASGFactory;
  private readonly jarPath: string;

  constructor(codebaseASGFactory: CodebaseASGFactory) {
    this.codebaseASGFactory = codebaseASGFactory;
    this.jarPath = JavaParserCliAccess.resolveJarPath();
  }

  private static resolveJarPath(): string {
    // works from both src/ (ts) and dist/src/ (compiled): walk up to find lib/.
    const here = path.dirname(fileURLToPath(import.meta.url));
    const depth = here.includes(`${path.sep}dist${path.sep}`) ? 4 : 3;
    const root = path.resolve(here, ...Array(depth - 1).fill(".."));

    return path.join(root, "lib", JAR_NAME);
  }

  async buildCodebaseASG(): Promise<CodebaseASG> {
    const stdout = await this.runCli();

    let raw: RawOutput;

    try {
      raw = JSON.parse(stdout) as RawOutput;
    } catch (err) {
      throw new Error(
        `JavaParser CLI produced invalid JSON: ${(err as Error).message}`,
      );
    }

    return this.codebaseASGFactory.create(raw.nodes, raw.edges);
  }

  private runCli(): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        "java",
        ["-jar", this.jarPath, "--src", process.cwd()],
        { maxBuffer: MAX_OUTPUT_BYTES, encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              new Error(
                `JavaParser CLI failed: ${error.message}${stderr ? `\n${stderr}` : ""}`,
              ),
            );

            return;
          }

          resolve(stdout);
        },
      );
    });
  }
}
