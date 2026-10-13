import * as React from 'react';
import ReactFlow, { addEdge, Background, ConnectionMode, Controls, MarkerType, MiniMap } from 'reactflow';
import type { Connection, Edge, EdgeTypes, Node, NodeTypes } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { BPMCanvasAlignmentGuides } from './BPMCanvasAlignmentGuides';
import { BPMSelectionHUD } from './BPMSelectionHUD';
import { BPMShapePalette } from './BPMShapePalette';
import { canonicalizeHandleId } from '../edges/edge-routing-utils';
import { isBadgeNodeType } from './bpm-editor-constants';

interface BPMCanvasProps {
  nodes: Node[];
  edges: Edge[];
  globalScale: number;
  isLocked: boolean;
  isTouchReadOnly: boolean;
  isMobileView: boolean;
  alignmentLines: { horizontal?: number; vertical?: number };
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  selectedNode: Node | undefined;
  selectedEdge: Edge | undefined;
  unmappedControls: { id: string }[];
  subProcess: string;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setDirty: (dirty: boolean) => void;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  onInit: (instance: import('reactflow').ReactFlowInstance) => void;
  onNodesChange: (changes: import('reactflow').NodeChange[]) => void;
  onEdgesChange: (changes: import('reactflow').EdgeChange[]) => void;
  onNodesDelete: ((deleted: Node[]) => void) | undefined;
  onEdgesDelete: ((deleted: Edge[]) => void) | undefined;
  onNodeDrag: (event: React.MouseEvent, node: Node) => void;
  onNodeDragStop: (event: React.MouseEvent, node: Node) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onOpenProperties: (id: string) => void;
  onInspectMobile: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  onUpdateEdgeRouting: (edgeId: string, mode: 'auto' | '1-corner' | '2-corner', resetOffset?: boolean) => void;
  onDeleteSelected: () => void;
  onCreateStartNode: () => void;
  onCreateEndNode: () => void;
  onCreateActivityNode: (type: string) => void;
  onCreateSwimlane: () => void;
}

export function BPMCanvas(props: BPMCanvasProps) {
  const {
    nodes,
    edges,
    globalScale,
    isLocked,
    isTouchReadOnly,
    isMobileView,
    alignmentLines,
    nodeTypes,
    edgeTypes,
    selectedNode,
    selectedEdge,
    unmappedControls,
    subProcess,
  } = props;
  const { t } = useTranslation(['bpm', 'common']);
  // True while a connection drag is in flight: all handles are revealed
  // so drops land easily at low zoom (Q6). Reset on drop or cancel.
  const [isConnecting, setIsConnecting] = React.useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Mobile read-only banner */}
      <div className="md:hidden flex items-center gap-2 flex-wrap px-4 py-2 bg-slate-100 border-b border-slate-200 shrink-0">
        <Eye className="h-4 w-4 text-slate-500 shrink-0" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-600 shrink-0">
          {t('bpm:mobile.viewMode', { defaultValue: 'Mode Lihat' })}
        </span>
        <span className="hidden min-[360px]:inline text-xs text-slate-500 truncate min-w-0 flex-1">
          {t('bpm:mobile.viewModeHint', { defaultValue: 'Read-only di HP — sunting di desktop' })}
        </span>
        <span className="sr-only min-[360px]:hidden">
          {t('bpm:mobile.viewModeHint', { defaultValue: 'Read-only di HP — sunting di desktop' })}
        </span>
      </div>

      {/* ReactFlow Canvas Viewport */}
      <div
        className={
          'flex-1 relative h-full w-full overflow-hidden' +
          (isConnecting ? ' [&_.react-flow__handle]:opacity-100 [&_.react-flow__handle]:scale-110' : '')
        }
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          minZoom={0.02}
          maxZoom={2.5}
          connectionRadius={32}
          connectionMode={ConnectionMode.Loose}
          connectionLineStyle={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '6 4' }}
          style={
            {
              '--bpm-global-width-scale': globalScale / 100,
              '--bpm-global-font-scale': globalScale / 100,
            } as React.CSSProperties
          }
          onInit={props.onInit}
          onNodesChange={isTouchReadOnly ? undefined : props.onNodesChange}
          onEdgesChange={isTouchReadOnly ? undefined : props.onEdgesChange}
          onNodesDelete={isTouchReadOnly ? undefined : props.onNodesDelete}
          onEdgesDelete={isTouchReadOnly ? undefined : props.onEdgesDelete}
          deleteKeyCode={isTouchReadOnly ? null : ['Delete', 'Backspace']}
          nodesDraggable={!isTouchReadOnly}
          nodesConnectable={!isTouchReadOnly}
          elementsSelectable={true}
          onNodeDrag={props.onNodeDrag}
          onNodeDragStop={props.onNodeDragStop}
          onDragOver={props.onDragOver}
          onDrop={props.onDrop}
          onConnect={
            isTouchReadOnly
              ? undefined
              : (params: Connection) => {
                  props.pushState(nodes, edges);
                  props.setDirty(true);
                  // Persist canonical handle ids (qc-* drags included) so the
                  // arrow can never invert vs the drag direction (Q5).
                  const repairedSource = params.sourceHandle
                    ? (canonicalizeHandleId(params.sourceHandle, true) ?? undefined)
                    : params.sourceHandle;
                  const repairedTarget = params.targetHandle
                    ? (canonicalizeHandleId(params.targetHandle, false) ?? undefined)
                    : params.targetHandle;
                  props.setEdges((eds) =>
                    addEdge(
                      {
                        ...params,
                        sourceHandle: repairedSource,
                        targetHandle: repairedTarget,
                        type: 'bridge',
                        markerEnd: {
                          type: MarkerType.ArrowClosed,
                          width: 20,
                          height: 20,
                          color: '#0f172a',
                        },
                        style: { strokeWidth: 2, stroke: '#0f172a' },
                      },
                      eds,
                    ),
                  );
                }
          }
          onConnectStart={() => {
            if (!isTouchReadOnly) setIsConnecting(true);
          }}
          onConnectEnd={() => setIsConnecting(false)}
          onNodeClick={(_, node) => {
            // Select only: never opens the worksheet. Users can drag,
            // lock, or delete straight from the selection HUD.
            props.onSelectEdge('');
            if (isBadgeNodeType(node.type)) return;
            props.onSelectNode(node.id);
            // On mobile the edit HUD is hidden: tap opens the read-only inspector.
            if (isMobileView) props.onInspectMobile(node.id);
          }}
          onNodeDoubleClick={(_, node) => {
            // Explicit edit intent: select + open the worksheet.
            if (isBadgeNodeType(node.type)) return;
            // On mobile there is no editing: route to the read-only inspector.
            if (isMobileView) {
              props.onSelectNode(node.id);
              props.onInspectMobile(node.id);
              return;
            }
            props.onOpenProperties(node.id);
          }}
          onEdgeClick={(_, edge) => {
            props.onSelectEdge(edge.id);
          }}
          onPaneClick={props.onClearSelection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
        >
          {/* Visio-like Smart Alignment Guide Lines */}
          <BPMCanvasAlignmentGuides horizontal={alignmentLines.horizontal} vertical={alignmentLines.vertical} />
          <Background gap={16} size={1} color="hsl(var(--border))" />
          {/* MOBILE POLICY (2026-10-04, audit): BPM canvas view-only di <md — full edit desktop-only.
              Controls disembunyikan di mobile agar tidak menutupi kanvas & target sentuh kecil.
              Jangan aktifkan toolbar/palette/Controls di mobile tanpa RFC audit. */}
          <div className="hidden md:block">
            <Controls />
          </div>
          {/* Q6 exception (locked): zoom/fit Controls are view actions, not edit.
              Compact variant (no interactive toggle), lifted above MobileBottomNav. */}
          <div className="md:hidden">
            <Controls
              showZoom
              showFitView
              showInteractive={false}
              position="bottom-right"
              style={{ marginBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
            />
          </div>
          <div className="hidden md:block">
            <MiniMap />
          </div>

          {/* Process Elements & Flow Controls Palette (desktop only) */}
          <div className="hidden md:block">
            <BPMShapePalette
              subProcess={subProcess}
              isLocked={isLocked}
              onCreateStartNode={props.onCreateStartNode}
              onCreateEndNode={props.onCreateEndNode}
              onCreateActivityNode={props.onCreateActivityNode}
              onCreateSwimlane={props.onCreateSwimlane}
              unmappedControls={unmappedControls}
            />

            {/* High-Contrast Selection Awareness HUD */}
            <BPMSelectionHUD
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              isLocked={isLocked}
              onToggleLock={props.onToggleLock}
              onUpdateEdgeLabel={props.onUpdateEdgeLabel}
              onUpdateEdgeRouting={props.onUpdateEdgeRouting}
              onEditSelected={() => {
                if (selectedNode) props.onOpenProperties(selectedNode.id);
              }}
              onDeleteSelected={props.onDeleteSelected}
              onClearSelection={props.onClearSelection}
            />
          </div>
        </ReactFlow>
      </div>
    </div>
  );
}
