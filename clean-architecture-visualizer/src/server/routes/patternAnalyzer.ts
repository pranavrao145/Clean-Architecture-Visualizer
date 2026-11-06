import { Router } from 'express';
import { PatternAnalyzerController } from '../../interface_adapter/patternAnalyzer/patternAnalyzerController.js';
import { PatternAnalyzerPresenter } from '../../interface_adapter/patternAnalyzer/patternAnalyzerPresenter.js';
import { PatternAnalyzerInteractor } from '../../use_case/patternAnalyzer/patternAnalyzerInteractor.js';

/**
 * Detects the requested design patterns in the analysed codebase and returns
 * the UML (plus pattern metadata) needed to visualize them.
 */
export function createPatternAnalyzerRouter(): Router {
  const router = Router();

  router.post('/pattern-analyzer', async (req, res) => {
    const presenter = new PatternAnalyzerPresenter();
    const interactor = new PatternAnalyzerInteractor(presenter);
    const controller = new PatternAnalyzerController(interactor);

    await controller.execute(req.body?.patterns);

    const error = presenter.getError();
    if (error) {
      res.status(400).json({ error });
      return;
    }

    res.json(presenter.getResponse());
  });

  return router;
}
