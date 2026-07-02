## Technical Design

This design outlines both the UI changes in the BPM Editor and the backend AI OCR upgrades to automatically detect, layout, and nest swimlanes.

### 1. Backend OCR Schema & System Instruction Upgrades (`worker/routes/bpm.ts`)

We will update the Gemini JSON schema to include swimlanes and parent-child grouping.

#### Response Schema Changes:
```typescript
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: {
            type: SchemaType.STRING,
            enum: [
              "start", "end", "activity", "manual-input", "external-process", 
              "automated-activity", "decision", "document", "archive", "data-media", 
              "reference", "alternate-process", "data", "predefined-process", 
              "internal-storage", "multi-document", "preparation", "manual-operation", 
              "card", "punched-tape", "summing-junction", "or", "collate", "sort", 
              "extract", "merge", "stored-data", "delay", "sequential-access", 
              "direct-access", "display", "loop-limit", "annotation",
              "swimlane" // Added
            ]
          },
          label: { type: SchemaType.STRING },
          position: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER }
            },
            required: ["x", "y"]
          },
          parentId: { type: SchemaType.STRING }, // Parent Swimlane ID
          department: { type: SchemaType.STRING }, // For swimlane headers
          function: { type: SchemaType.STRING }, // For swimlane headers
          width: { type: SchemaType.NUMBER }, // Visual width
          height: { type: SchemaType.NUMBER } // Visual height
        },
        required: ["id", "type", "label", "position"]
      }
    },
    edges: { ... }
  },
  required: ["nodes", "edges"]
};
```

#### System Instruction Upgrades:
- Instruct Gemini to identify vertical/horizontal swimlanes separating departments and functions.
- Instruct Gemini to create `swimlane` type nodes and extract `department` and `function` labels from their headers.
- For shapes located inside a swimlane boundary, populate their `parentId` matching the parent swimlane's `id`.

---

### 2. Frontend Layout & Position Translation (`BPMEditor.tsx`)

In React Flow, child nodes inside a parent node (like a Swimlane) use **relative coordinates** (offset from the parent's top-left corner), whereas the AI will output absolute canvas coordinates (0-1000). 

We must translate coordinates during the import apply process:

```typescript
const handleApplyOcr = () => {
  if (!parsedDiagram) return;

  // 1. Separate swimlanes and regular shape nodes
  const rawSwimlanes = parsedDiagram.nodes.filter((n: any) => n.type === 'swimlane');
  const rawShapes = parsedDiagram.nodes.filter((n: any) => n.type !== 'swimlane');

  // 2. Map and layout swimlanes
  const mappedSwimlanes = rawSwimlanes.map((lane: any) => ({
    id: lane.id,
    type: 'swimlane',
    position: { x: lane.position.x, y: lane.position.y },
    zIndex: -1,
    style: { width: lane.width || 400, height: lane.height || 1000 },
    data: {
      label: lane.label || 'Lane',
      department: lane.department || 'Dept',
      function: lane.function || 'Func',
      isLocked: false,
    }
  }));

  // 3. Map shape nodes, calculating relative offsets for nested children
  const mappedShapes = rawShapes.map((n: any) => {
    const parentLane = rawSwimlanes.find((lane: any) => lane.id === n.parentId);
    
    // If the node has a parent swimlane, calculate relative offset
    let posX = n.position.x;
    let posY = n.position.y;
    if (parentLane) {
      posX = Math.max(10, n.position.x - parentLane.position.x);
      posY = Math.max(80, n.position.y - parentLane.position.y); // Leave space for swimlane header
    }

    return {
      id: n.id,
      type: n.type,
      parentId: n.parentId || undefined,
      extent: n.parentId ? 'parent' : undefined,
      position: { x: posX, y: posY },
      data: {
        label: n.label,
        type: n.type,
      }
    };
  });

  // 4. Inject React Flow event handlers (onChangeDepartment, onChangeFunction, etc.)
  const finalNodes = [...mappedSwimlanes, ...mappedShapes].map((node: any) => {
    const isSwimlane = node.type === 'swimlane';
    const baseNode = {
      ...node,
      draggable: true,
      zIndex: isSwimlane ? -1 : 10,
      dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
    };

    if (isSwimlane) {
      baseNode.data = {
        ...node.data,
        onToggleLock: () => toggleNodeLock(node.id),
        onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
        onChangeFunction: (v: string) => updateNodeData(node.id, { function: v })
      };
    } else {
      baseNode.data = {
        ...node.data,
        onToggleLock: () => toggleNodeLock(node.id)
      };
    }
    return baseNode;
  });

  setNodes(finalNodes);
  setEdges(standardEdges);
  setDirty(true);
  
  // Close dialog...
};
```
