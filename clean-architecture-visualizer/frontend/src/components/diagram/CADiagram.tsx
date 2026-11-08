// This file contains all the logic for displaying the CA Diagram, including fetching the data and handling loading/error states.
// The actual rendering of the diagram is delegated to CADiagramView, which is a pure presentational component that receives all
// the data it needs as props.

import { CircularProgress, Container, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import type { cleanLayer } from '../../../../src/types/clean-layer';
import type { cleanNode } from '../../../../src/types/cleanNode';
import { useInteraction } from '../../actions/useAnalysis';
import type {
  CAComponentType,
  CALayer,
  CANode,
  InteractionDetail,
} from '../../lib/types';
import { CADiagramView } from './CADiagramView';
import type { NodeClickInfo } from './CANodeView';

const componentLayerMap: Record<CAComponentType, CALayer> = {
  Controller: 'InterfaceAdapters',
  Presenter: 'InterfaceAdapters',
  View: 'Frameworks',
  ViewModel: 'InterfaceAdapters',
  InputBoundary: 'ApplicationBusinessRules',
  OutputBoundary: 'ApplicationBusinessRules',
  InputData: 'ApplicationBusinessRules',
  OutputData: 'ApplicationBusinessRules',
  Interactor: 'ApplicationBusinessRules',
  Entity: 'EnterpriseBusinessRules',
  DataAccessInterface: 'ApplicationBusinessRules',
  DataAccess: 'Frameworks',
  Database: 'Frameworks',
};

const cleanNodeToCAComponentType: Record<cleanNode, CAComponentType> = {
  controller: 'Controller',
  presenter: 'Presenter',
  viewModel: 'ViewModel',
  view: 'View',
  dataAccess: 'DataAccess',
  dataAccessInterface: 'DataAccessInterface',
  database: 'Database',
  entities: 'Entity',
  inputData: 'InputData',
  inputBoundary: 'InputBoundary',
  outputData: 'OutputData',
  outputBoundary: 'OutputBoundary',
  useCaseInteractor: 'Interactor',
};

const cleanLayerToCALayer: Record<cleanLayer, CALayer> = {
  interfaceAdapters: 'InterfaceAdapters',
  frameworksAndDrivers: 'Frameworks',
  enterpriseBusinessRules: 'EnterpriseBusinessRules',
  applicationBusinessRules: 'ApplicationBusinessRules',
};

const getNodeByType = (nodes: CANode[], type: CAComponentType): CANode => {
  const node = nodes.find((candidate) => candidate.type === type);
  return (
    node ?? {
      id: `missing-${type}`,
      name: `${type} (Missing)`,
      type,
      layer: componentLayerMap[type],
      status: 'MISSING',
    }
  );
};

/**
 * Converts node and edge data from backend to frontend types
 *
 * Specifically:
 * - `cleanNode` to `CAComponentType`
 * - `cleanLayer` to `CALayer`
 *
 * Note: `data` is actually not an `InteractionDetail` object since `data.nodes[number].type`
 * is really of type `cleanNode` (backend type) rather than `CAComponentType` (frontend type).
 * Likewise, `data.nodes[number].layer` is really of type `cleanLayer` rather than `CALayer`.
 *
 * However `useInteractor`, the hook that makes the API call to retrieve `data` from the
 * backend, has return type declared (incorrectly) as `InteractionDetail`. Thus to avoid
 * type errors from TypeScript, the `data` parameter is typed as `InteractionDetail`.
 *
 * @param data response object received from the backend
 * @returns a new object with the converted types
 */
function formatInteractionData(data: InteractionDetail): InteractionDetail {
  return {
    ...data,
    nodes: data.nodes.map((node) => ({
      ...node,
      type: cleanNodeToCAComponentType[node.type as cleanNode],
      layer: cleanLayerToCALayer[node.layer as cleanLayer],
    })),
  };
}

export function CADiagram({
  onNodeClick,
}: {
  onNodeClick?: (info: NodeClickInfo) => void;
}) {
  const { interactionId } = useParams<{ interactionId: string }>();
  const {
    data: rawInteractionData,
    isLoading,
    isError,
    error,
  } = useInteraction(interactionId ?? '');

  const interactionData = rawInteractionData
    ? formatInteractionData(rawInteractionData)
    : undefined;

  const areNodesInteractive = !!onNodeClick;

  if (interactionId === undefined) {
    return (
      <Typography color="error">
        CA Diagram not supported for this view.
      </Typography>
    );
  }

  if (!interactionId) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">Missing interaction id in URL.</Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (isError || !interactionData) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">
          {error instanceof Error
            ? error.message
            : 'Failed to load interaction data.'}
        </Typography>
      </Container>
    );
  }

  const nodes = interactionData.nodes;

  const controller = getNodeByType(nodes, 'Controller');
  const presenter = getNodeByType(nodes, 'Presenter');
  const viewModel = getNodeByType(nodes, 'ViewModel');
  const inputData = getNodeByType(nodes, 'InputData');
  const inputBoundary = getNodeByType(nodes, 'InputBoundary');
  const interactor = getNodeByType(nodes, 'Interactor');
  const outputBoundary = getNodeByType(nodes, 'OutputBoundary');
  const outputData = getNodeByType(nodes, 'OutputData');
  const dataAccessInterface = getNodeByType(nodes, 'DataAccessInterface');
  const entities = getNodeByType(nodes, 'Entity');
  const view = getNodeByType(nodes, 'View');
  const dataAccess = getNodeByType(nodes, 'DataAccess');
  const database = getNodeByType(nodes, 'Database');
  const edges = interactionData.edges;

  return (
    <CADiagramView
      controller={controller}
      presenter={presenter}
      viewModel={viewModel}
      inputData={inputData}
      inputBoundary={inputBoundary}
      interactor={interactor}
      outputBoundary={outputBoundary}
      outputData={outputData}
      dataAccessInterface={dataAccessInterface}
      entities={entities}
      view={view}
      dataAccess={dataAccess}
      database={database}
      edges={edges}
      areNodesInteractive={areNodesInteractive}
      onNodeClick={onNodeClick}
    />
  );
}
