import { Router } from 'express';
import { FileAccess } from '../../data_access/fileAccess.js';
import type { SessionDBAccessInterface } from '../../data_access/sessionDBAccessInterface.js';
import { GetFilesWithViolationsController } from '../../interface_adapter/getFilesWithViolations/getFilesWithViolationsController.js';
import { GetFilesWithViolationsPresenter } from '../../interface_adapter/getFilesWithViolations/getFilesWithViolationsPresenter.js';
import { GetProjectSummaryController } from '../../interface_adapter/getProjectSummary/getProjectSummaryController.js';
import { GetProjectSummaryPresenter } from '../../interface_adapter/getProjectSummary/getProjectSummaryPresenter.js';
import { GetUseCaseInfoController } from '../../interface_adapter/getUseCaseInfo/getUseCaseInfoController.js';
import { GetUseCaseInfoPresenter } from '../../interface_adapter/getUseCaseInfo/getUseCaseInfoPresenter.js';
import { GetViolationsController } from '../../interface_adapter/getViolations/getViolationsController.js';
import { GetViolationsPresenter } from '../../interface_adapter/getViolations/getViolationsPresenter.js';
import { GetFilesWithViolationsInteractor } from '../../use_case/getFilesWithViolations/getFilesWithViolationsInteractor.js';
import { GetFilesWithViolationsOutputData } from '../../use_case/getFilesWithViolations/getFilesWithViolationsOutputData.js';
import { GetProjectSummaryInteractor } from '../../use_case/getProjectSummary/getProjectSummaryInteractor.js';
import { GetProjectSummaryOutputData } from '../../use_case/getProjectSummary/getProjectSummaryOutputData.js';
import { GetUseCaseInfoInteractor } from '../../use_case/getUseCaseInfo/getUseCaseInfoInteractor.js';
import { GetUseCaseInfoOutputData } from '../../use_case/getUseCaseInfo/getUseCaseInfoOutputData.js';
import { GetViolationsInteractor } from '../../use_case/getViolations/GetViolationsInteractor.js';
import { GetViolationsOutputData } from '../../use_case/getViolations/GetViolationsOutputData.js';

/**
 * Builds the /analysis routes around the session DB that graph verification
 * populated. The DB is injected so the routes read the same in-memory data
 * instead of a copy loaded before verification ran.
 */
export function createAnalysisRouter(
  dbAccess: SessionDBAccessInterface
): Router {
  const router = Router();
  const fileAccess = new FileAccess();

  router.get('/analysis/summary', (_req, res) => {
    const outputData = new GetProjectSummaryOutputData();
    const interactor = new GetProjectSummaryInteractor(dbAccess, outputData);
    const controller = new GetProjectSummaryController(interactor);
    const presenter = new GetProjectSummaryPresenter(outputData);

    controller.execute();
    const result = presenter.getOutputData();

    if (!result) {
      res
        .status(404)
        .json({ error: `Failure in collecting the Project Summary` });
      return;
    }

    res.json(result);
  });

  router.get('/analysis/interaction/:id', async (req, res) => {
    const outputData = new GetUseCaseInfoOutputData();
    const interactor = new GetUseCaseInfoInteractor(dbAccess, outputData);
    const controller = new GetUseCaseInfoController(interactor);
    const presenter = new GetUseCaseInfoPresenter(outputData);

    await controller.execute(req.params.id);
    const result = presenter.getOutputData();

    if (!result) {
      res
        .status(404)
        .json({ error: `Interaction '${req.params.id}' not found.` });
      return;
    }

    res.json(result);
  });

  router.get('/analysis/violations/:interactionId', async (req, res) => {
    const outputData = new GetViolationsOutputData();
    const interactor = new GetViolationsInteractor(
      dbAccess,
      fileAccess,
      outputData
    );
    const controller = new GetViolationsController(interactor);
    const presenter = new GetViolationsPresenter(outputData);

    await controller.execute(req.params.interactionId);
    const result = presenter.getOutputData();
    if (!result) {
      res.status(404).json({
        error: `Interaction '${req.params.interactionId}' not found.`,
      });
      return;
    }

    res.json(result);
  });

  router.get('/analysis/files-with-violations', (_req, res) => {
    const outputData = new GetFilesWithViolationsOutputData();
    const interactor = new GetFilesWithViolationsInteractor(
      dbAccess,
      outputData
    );
    const controller = new GetFilesWithViolationsController(interactor);
    const presenter = new GetFilesWithViolationsPresenter(outputData);

    controller.execute();
    const result = presenter.getOutputData();

    res.json(result);
  });

  return router;
}
