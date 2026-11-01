import type { CodebaseASG } from "../entity/CodebaseASG.js";

export interface JavaParserCliAccessInterface {
  buildCodebaseASG(): Promise<CodebaseASG>;
}
