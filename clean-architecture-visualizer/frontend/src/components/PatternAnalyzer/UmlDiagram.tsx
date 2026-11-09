import { Box, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Controls,
  type Edge,
  type EdgeProps,
  Handle,
  type Node,
  type NodeProps,
  Position,
  useNodesState,
  useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  arrowEndpoints,
  CLASS_WIDTH,
  type ClassBox,
  HEADER_HEIGHT,
  HIGHLIGHT_COLORS,
  type PatternAnalyzerViewModel,
  type RelationshipArrow,
  ROW_HEIGHT,
} from '../../lib/pattern-analyzer-view-model';

/**
 * Called with the clicked class, and the pattern instances of what was clicked.
 * A click on a plain member gives no instances, so the pattern stays selected.
 */
export type SelectElement = (classFqn: string, instanceIds: string[]) => void;

type ClassNodeData = {
  box: ClassBox;
  isSelected: boolean;
  onSelect: SelectElement;
};

// React Flow only draws an edge between handles. Arrows work out their own ends
// (see ArrowEdge), so these only need to exist, and stay out of sight.
const hiddenHandleStyle = { opacity: 0, pointerEvents: 'none' } as const;

const ClassNode = ({ data }: NodeProps<ClassNodeData>) => {
  const { box, isSelected, onSelect } = data;

  return (
    <Box
      data-testid={`class-${box.fqn}`}
      sx={{
        width: CLASS_WIDTH,
        height: box.height,
        bgcolor: 'background.paper',
        border: isSelected ? '3px solid' : '2px solid',
        borderColor: 'text.primary',
        boxSizing: 'border-box',
        cursor: 'grab',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={hiddenHandleStyle}
      />

      {/* Clicking the header selects the class and the pattern it takes part in. */}
      <Box
        component="button"
        onClick={() => onSelect(box.fqn, box.patternInstanceIds)}
        sx={{
          all: 'unset',
          display: 'block',
          boxSizing: 'border-box',
          width: '100%',
          height: HEADER_HEIGHT,
          lineHeight: `${HEADER_HEIGHT - 2}px`,
          textAlign: 'center',
          fontWeight: 700,
          cursor: 'pointer',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          borderBottom: '2px solid',
          borderColor: 'text.primary',
          '&:focus-visible': { outline: '2px solid', outlineOffset: -2 },
        }}
      >
        <Box
          component="span"
          sx={{
            px: 1,
            borderRadius: 2,
            bgcolor: HIGHLIGHT_COLORS[box.tone],
          }}
        >
          {box.kind !== 'class' && `«${box.kind}» `}
          {box.name}
        </Box>
      </Box>

      {box.members.map((member) => (
        <Box
          component="button"
          key={member.fqn}
          title={member.umlText}
          data-tone={member.tone}
          onClick={() => onSelect(box.fqn, member.patternInstanceIds)}
          sx={{
            all: 'unset',
            display: 'block',
            boxSizing: 'border-box',
            width: 'calc(100% - 8px)',
            height: ROW_HEIGHT - 2,
            lineHeight: `${ROW_HEIGHT - 2}px`,
            mx: '4px',
            my: '1px',
            px: 1,
            borderRadius: 2,
            fontFamily: 'monospace',
            fontSize: 12,
            cursor: 'pointer',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            bgcolor: HIGHLIGHT_COLORS[member.tone],
            '&:focus-visible': { outline: '2px solid', outlineOffset: -2 },
          }}
        >
          {member.umlText}
        </Box>
      ))}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={hiddenHandleStyle}
      />
    </Box>
  );
};

/**
 * Draws an arrow in UML style, with a green or red band when highlighted. React
 * Flow draws edges beneath nodes, so an arrow never covers a box's text.
 */
const ArrowEdge = ({
  id,
  source,
  target,
  data,
}: EdgeProps<RelationshipArrow>) => {
  // Reading the live nodes makes the arrow follow a box as it's dragged.
  const from = useStore((state) => state.nodeInternals.get(source));
  const to = useStore((state) => state.nodeInternals.get(target));

  if (!data || !from?.width || !from.height || !to?.width || !to.height) {
    return null;
  }

  const { x1, y1, x2, y2 } = arrowEndpoints(
    { ...from.position, width: from.width, height: from.height },
    { ...to.position, width: to.width, height: to.height }
  );
  const line = `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <g data-testid={`arrow-${id}`}>
      {data.tone !== 'none' && (
        <path
          d={line}
          fill="none"
          stroke={HIGHLIGHT_COLORS[data.tone]}
          strokeWidth={12}
        />
      )}
      <path
        d={line}
        fill="none"
        stroke="black"
        strokeWidth={1.5}
        strokeDasharray={data.kind === 'implements' ? '6 4' : undefined}
        markerEnd={
          data.kind === 'association'
            ? 'url(#open-arrow)'
            : 'url(#hollow-arrow)'
        }
      />
    </g>
  );
};

// Kept outside the component, as React Flow asks, so they don't remount boxes.
const nodeTypes = { umlClass: ClassNode };
const edgeTypes = { umlArrow: ArrowEdge };

const ArrowMarkers = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      <marker
        id="open-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="9"
        markerHeight="9"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="black" />
      </marker>
      <marker
        id="hollow-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="11"
        markerHeight="11"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="white" stroke="black" />
      </marker>
    </defs>
  </svg>
);

type UmlDiagramProps = {
  viewModel: PatternAnalyzerViewModel;
  onSelect: SelectElement;
};

/** A class diagram whose boxes can be dragged, and which can pan and zoom. */
export const UmlDiagram = ({ viewModel, onSelect }: UmlDiagramProps) => {
  const { t } = useTranslation('patternAnalyzer');
  const { classes, arrows, selectedClass } = viewModel;
  const [nodes, setNodes, onNodesChange] = useNodesState<ClassNodeData>([]);

  // Selecting or re-analyzing rebuilds the View Model. Classes already on the
  // diagram stay where the user dragged them; only new ones take their layout.
  useEffect(() => {
    setNodes((current) => {
      const existing = new Map(current.map((node) => [node.id, node]));
      return classes.map((box): Node<ClassNodeData> => {
        const data = {
          box,
          isSelected: box.fqn === selectedClass?.fqn,
          onSelect,
        };
        const node = existing.get(box.fqn);
        return node
          ? { ...node, data }
          : {
              id: box.fqn,
              type: 'umlClass',
              position: { x: box.x, y: box.y },
              width: CLASS_WIDTH,
              height: box.height,
              data,
            };
      });
    });
  }, [classes, selectedClass?.fqn, onSelect, setNodes]);

  const edges = useMemo(
    () =>
      arrows.map(
        (arrow): Edge<RelationshipArrow> => ({
          id: arrow.id,
          type: 'umlArrow',
          source: arrow.fromFqn,
          target: arrow.toFqn,
          data: arrow,
        })
      ),
    [arrows]
  );

  if (classes.length === 0) {
    return <Typography sx={{ p: 3 }}>{t('empty')}</Typography>;
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ArrowMarkers />
      <ReactFlow
        aria-label={t('diagramLabel')}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        // Small hand movements during a click shouldn't count as a drag.
        nodeDragThreshold={3}
        // Clicks are handled by the box's own buttons, and nothing can be edited.
        elementsSelectable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={2}
        fitView
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
};
