import { Router } from 'express';
import type { JavaParserCliAccessInterface } from '../../data_access/JavaParserCliAccessInterface.js';
import type { PatternsAccessInterface } from '../../data_access/PatternsAccessInterface.js';
import { PatternAnalyzerController } from '../../interface_adapter/pattern-analyzer/pattern-analyzer-controller.js';
import { PatternAnalyzerPresenter } from '../../interface_adapter/pattern-analyzer/pattern-analyzer-presenter.js';
import { PatternAnalyzerInteractor } from '../../use_case/pattern-analyzer/pattern-analyzer-interactor.js';

export function createDesignPatternRouter(
  javaParserCliAccess: JavaParserCliAccessInterface,
  patternsAccess: PatternsAccessInterface
): Router {
  const router = Router();

  router.post('/design-patterns/analyze', async (req, res) => {
    const presenter = new PatternAnalyzerPresenter();
    const interactor = new PatternAnalyzerInteractor(
      patternsAccess,
      javaParserCliAccess,
      presenter
    );
    const controller = new PatternAnalyzerController(interactor);
    
    // Body: { "patternIds": ["singleton", ...] }, the patterns the user chose.
    await controller.execute(req.body?.patternIds);

    const { status, body } = presenter.getResponse();
    res.status(status).json(body);
  });

  return router;
}
