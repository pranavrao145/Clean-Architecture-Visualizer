import { beforeEach, describe, expect, it } from '@jest/globals';
import { SessionDBAccess } from '../../../src/data_access/sessionDBAccess.js';
import type { GetUseCaseInfoInputData } from '../../../src/use_case/getUseCaseInfo/getUseCaseInfoInputData.js';
import { GetUseCaseInfoInteractor } from '../../../src/use_case/getUseCaseInfo/getUseCaseInfoInteractor.js';
import type {
  GetUseCaseInfoOutputData,
  UseCaseInfoResponse,
} from '../../../src/use_case/getUseCaseInfo/getUseCaseInfoOutputData.js';
import { RecordingOutputData } from '../doubles/recording-output-data.js';
import { makeStoredUseCase } from '../fixtures/stored-use-case.js';

const genericDBAccess = new SessionDBAccess();

function makeInputData(id: string): GetUseCaseInfoInputData {
  return {
    getUseCaseId: () => id,
  } as unknown as GetUseCaseInfoInputData;
}

// The Output Data classes have private fields, so the recording double needs a cast.
function makeOutputData(): GetUseCaseInfoOutputData &
  RecordingOutputData<UseCaseInfoResponse> {
  return new RecordingOutputData<UseCaseInfoResponse>() as unknown as GetUseCaseInfoOutputData &
    RecordingOutputData<UseCaseInfoResponse>;
}

describe('GetUseCaseInfoInteractor', () => {
  beforeEach(() => {
    genericDBAccess.resetDB();
  });

  it('returns nothing if the use case ID does not exist', async () => {
    const outputData = makeOutputData();
    const interactor = new GetUseCaseInfoInteractor(
      genericDBAccess,
      outputData
    );

    await interactor.execute(makeInputData('non-existent'));

    expect(outputData.getOutputData()).toBeUndefined();
  });

  it('correctly assembles nodes from fileKeys', async () => {
    const filePath = 'src/entities/User.java';

    // 1. Setup a node in the DB
    genericDBAccess.upsertNode({
      id: 'node-1',
      name: 'User',
      type: 'entities',
      layer: 'enterpriseBusinessRules',
      filePath: filePath,
      status: 'VALID',
    });

    // 2. Setup a use case that references that file
    const mockUseCase = makeStoredUseCase({
      id: 'uc-1',
      name: 'Create User',
      fileKeys: [filePath],
      missingNodes: [],
      outNeighbours: {},
    });
    genericDBAccess.upsertUseCase(mockUseCase);

    const outputData = makeOutputData();
    const interactor = new GetUseCaseInfoInteractor(
      genericDBAccess,
      outputData
    );

    await interactor.execute(makeInputData('uc-1'));

    expect(outputData.result.interaction_name).toBe('Create User');
    // Check if node was found via fileKey
    expect(outputData.result.nodes).toHaveLength(1);
    expect(outputData.result.nodes[0].file_path).toBe(filePath);
    expect(outputData.result.decoupling).toBe(false);
  });

  it('includes missing nodes based on the use case missingNodes list', async () => {
    // Setup a "MISSING" status node in the DB
    genericDBAccess.upsertNode({
      id: 'missing-controller',
      type: 'controller',
      layer: 'interfaceAdapters',
      status: 'MISSING',
    });

    const mockUseCase = makeStoredUseCase({
      id: 'uc-1',
      name: 'Test Missing',
      fileKeys: [],
      missingNodes: ['controller'],
      outNeighbours: {},
    });
    genericDBAccess.upsertUseCase(mockUseCase);

    const outputData = makeOutputData();
    const interactor = new GetUseCaseInfoInteractor(
      genericDBAccess,
      outputData
    );

    await interactor.execute(makeInputData('uc-1'));

    const missingNode = outputData.result.nodes.find(
      (n) => n.status === 'MISSING'
    );
    expect(missingNode).toMatchObject({ type: 'controller' });
    expect(outputData.result.decoupling).toBe(false);
  });

  it('assembles edges from the outNeighbours map and checks for decoupling when edge depends on interactor', async () => {
    const sourceId = 'controller';
    const targetId = 'useCaseInteractor';
    const edgeId = `${sourceId}->${targetId}`;

    // Setup the edge in the DB
    genericDBAccess.upsertEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'DEPENDENCY',
      status: 'INCORRECT_DEPENDENCY',
    });

    const mockUseCase = makeStoredUseCase({
      id: 'uc-edge',
      name: 'Edge Test',
      fileKeys: [],
      missingNodes: [],
      outNeighbours: {
        [sourceId]: [targetId],
      },
    });
    genericDBAccess.upsertUseCase(mockUseCase);

    const outputData = makeOutputData();
    const interactor = new GetUseCaseInfoInteractor(
      genericDBAccess,
      outputData
    );

    await interactor.execute(makeInputData('uc-edge'));

    expect(outputData.result.edges).toHaveLength(1);
    expect(outputData.result.edges[0].id).toBe(edgeId);
    expect(outputData.result.edges[0].status).toBe('INCORRECT_DEPENDENCY');
    expect(outputData.result.decoupling).toBe(true);
  });

  it('ensures decoupling is false when there is no dependency on interactor', async () => {
    const sourceId = 'controller';
    const targetId = 'inputBoundary';
    const edgeId = `${sourceId}->${targetId}`;

    // Setup the edge in the DB
    genericDBAccess.upsertEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'DEPENDENCY',
      status: 'VALID',
    });

    const mockUseCase = makeStoredUseCase({
      id: 'uc-edge',
      name: 'Edge Test',
      fileKeys: [],
      missingNodes: [],
      outNeighbours: {
        [sourceId]: [targetId],
      },
    });
    genericDBAccess.upsertUseCase(mockUseCase);

    const outputData = makeOutputData();
    const interactor = new GetUseCaseInfoInteractor(
      genericDBAccess,
      outputData
    );

    await interactor.execute(makeInputData('uc-edge'));

    expect(outputData.result.edges).toHaveLength(1);
    expect(outputData.result.edges[0].id).toBe(edgeId);
    expect(outputData.result.edges[0].status).toBe('VALID');
    expect(outputData.result.decoupling).toBe(false);
  });
});
