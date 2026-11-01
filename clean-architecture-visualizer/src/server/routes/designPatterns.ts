import { Router } from "express";
import type { JavaParserCliAccessInterface } from "../../data_access/JavaParserCliAccessInterface.js";

export function createDesignPatternRouter(
  javaParserCliAccess: JavaParserCliAccessInterface,
): Router {
  const router = Router();

  router.get("/design-patterns/asg", async (_req, res) => {
    try {
      // TODO: make compliant with Clean Architecture
      const asg = await javaParserCliAccess.buildCodebaseASG();

      res.json({ nodes: asg.getNodes(), edges: asg.getEdges() });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
