import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link } from "@inertiajs/react";
import axios from "axios";
import {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type ReactFlowInstance,
  ReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type NodeChange,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { OnMove } from "@xyflow/react";
import { Wrench, Users, Trash2 } from 'lucide-react';
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HallShape = 'rect' | 'rounded' | 'ellipse';
function buildMachineNodeStyle(width = 180, height = 100) {
  const sizeBase = Math.min(width, height);
  const fontSize = Math.max(11, Math.min(20, Math.round(sizeBase / 6.5)));

  return {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize,
    background: "#ffffff",
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    overflow: 'hidden',
  };
}

function sanitizeForJson(value: unknown): unknown {
  if (value === null) return null;

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForJson(entry));
  }

  if (valueType === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeForJson(entry);
    }
    return result;
  }

  return null;
}

function buildHallAreaStyle(width: number, height: number, shape: HallShape, draft = false) {
  const borderRadius = shape === 'ellipse' ? '50%' : shape === 'rounded' ? 22 : 8;

  return {
    width,
    height,
    border: `2px dashed ${draft ? '#1d4ed8' : '#2563eb'}`,
    borderRadius,
    background: draft ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.05)',
    color: draft ? '#1e40af' : '#1d4ed8',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    overflow: 'hidden',
  };
}

function buildRoadNodeStyle(orientation: 'horizontal' | 'vertical', lengthPx: number, thicknessPx: number) {
  return {
    background: '#000000',
    width: orientation === 'horizontal' ? lengthPx : thicknessPx,
    height: orientation === 'horizontal' ? thicknessPx : lengthPx,
    borderRadius: 6,
  };
}

function distanceBetweenPoints(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.sqrt((first.x - second.x) ** 2 + (first.y - second.y) ** 2);
}

function buildClosedPolygonFromLines(
  lines: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>,
  tolerance = 8,
) {
  if (lines.length < 3) return null;

  const segments = lines.map((line) => ({
    start: { ...line.start },
    end: { ...line.end },
  }));

  const [firstSegment, ...remainingSegments] = segments;
  const orderedPoints: Array<{ x: number; y: number }> = [{ ...firstSegment.start }, { ...firstSegment.end }];
  let currentPoint = { ...firstSegment.end };
  const rest = [...remainingSegments];

  while (rest.length > 0) {
    const index = rest.findIndex((segment) => {
      return distanceBetweenPoints(segment.start, currentPoint) <= tolerance
        || distanceBetweenPoints(segment.end, currentPoint) <= tolerance;
    });

    if (index === -1) {
      return null;
    }

    const segment = rest[index];
    rest.splice(index, 1);

    const startMatches = distanceBetweenPoints(segment.start, currentPoint) <= tolerance;
    const nextPoint = startMatches ? segment.end : segment.start;
    orderedPoints.push({ ...nextPoint });
    currentPoint = { ...nextPoint };
  }

  if (distanceBetweenPoints(currentPoint, orderedPoints[0]) > tolerance) {
    return null;
  }

  return [...orderedPoints, { ...orderedPoints[0] }];
}

export default function DepartmentHallPreview() {
  const PX_PER_METER_BASE = 10;
  const [zoomLevel, setZoomLevel] = useState(1);
  const PX_PER_METER = PX_PER_METER_BASE * zoomLevel;
  const ROAD_LENGTH_M = 20;
  const ROAD_WIDTH_M = 2.4;
  const page = usePage();
  const props = page.props as any;
  const department = props.department ?? {};
  const machines = department.machines ?? [];
  const [localMachines, setLocalMachines] = useState(machines ?? []);
  const savedLayout = department.hall_layout ?? null;
  const ROAD_LENGTH = ROAD_LENGTH_M * PX_PER_METER;
  const ROAD_THICKNESS = ROAD_WIDTH_M * PX_PER_METER;
  // Track zoom changes from ReactFlow
  const onMove: OnMove = useCallback((event, viewport) => {
    setZoomLevel(viewport.zoom);
  }, []);

  const initialNodes = useMemo<Node[]>(() => {
    if (savedLayout?.nodes && Array.isArray(savedLayout.nodes) && savedLayout.nodes.length > 0) {
      const savedNodes: Node[] = (savedLayout.nodes as Node[]).map((node) => {
        const kind = String((node.data as any)?.kind ?? '');
        const id = String(node.id);
        const isRoad = kind === 'road' || id.startsWith('road-');

        if (!isRoad) return node;

        const orientation = ((node.data as any)?.orientation as 'horizontal' | 'vertical' | undefined)
          ?? ((Number((node.style as any)?.width ?? 0) >= Number((node.style as any)?.height ?? 0)) ? 'horizontal' : 'vertical');

        return {
          ...node,
          data: {
            ...(node.data ?? {}),
            kind: 'road',
            orientation,
          },
          style: {
            ...buildRoadNodeStyle(orientation, ROAD_LENGTH, ROAD_THICKNESS),
            ...(node.style ?? {}),
            width: orientation === 'horizontal' ? ROAD_LENGTH : ROAD_THICKNESS,
            height: orientation === 'horizontal' ? ROAD_THICKNESS : ROAD_LENGTH,
          },
        };
      });
      const existingMachineIds = new Set(savedNodes.map((n) => String(n.id)));

      const missingMachineNodes: Node[] = (machines ?? [])
        .filter((machine: any) => !existingMachineIds.has(String(machine.id)))
        .map((machine: any, index: number) => ({
          id: String(machine.id),
          position: { x: 40 + (index % 4) * 220, y: 40 + Math.floor(index / 4) * 130 },
          data: { label: `${machine.name ?? "Maszyna"}${machine.barcode ? ` (${machine.barcode})` : ""}`, kind: 'machine' },
          style: buildMachineNodeStyle(),
        }));

      return [...savedNodes, ...missingMachineNodes];
    }

    if (!Array.isArray(machines) || machines.length === 0) return [];

    const columns = 4;
    const xGap = 220;
    const yGap = 130;

    return machines.map((machine: any, index: number) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      return {
        id: String(machine.id),
        position: { x: 40 + col * xGap, y: 40 + row * yGap },
        data: {
          label: `${machine.name ?? "Maszyna"}${machine.barcode ? ` (${machine.barcode})` : ""}`,
          kind: 'machine',
        },
        style: buildMachineNodeStyle(),
      };
    });
  }, [ROAD_LENGTH, ROAD_THICKNESS, machines, savedLayout]);

  const initialEdges = useMemo<Edge[]>(() => {
    if (savedLayout?.edges && Array.isArray(savedLayout.edges)) {
      return savedLayout.edges;
    }
    return [];
  }, [savedLayout]);

  const initialHallLines = useMemo<Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>>(() => {
    if (!savedLayout?.hall_lines || !Array.isArray(savedLayout.hall_lines)) {
      return [];
    }

    return savedLayout.hall_lines
      .filter((line: any) => line?.start && line?.end)
      .map((line: any) => ({
        start: {
          x: Number(line.start.x) || 0,
          y: Number(line.start.y) || 0,
        },
        end: {
          x: Number(line.end.x) || 0,
          y: Number(line.end.y) || 0,
        },
      }));
  }, [savedLayout]);

  const initialHallAreaLabelPosition = useMemo<{ x: number; y: number } | null>(() => {
    if (!savedLayout?.hall_area_label_pos || typeof savedLayout.hall_area_label_pos !== 'object') {
      return null;
    }

    const parsedX = Number(savedLayout.hall_area_label_pos.x);
    const parsedY = Number(savedLayout.hall_area_label_pos.y);
    if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
      return null;
    }

    return {
      x: parsedX,
      y: parsedY,
    };
  }, [savedLayout]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawHallMode, setDrawHallMode] = useState(false);
  const [hallLineDraft, setHallLineDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [hallLines, setHallLines] = useState<Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>>(initialHallLines);
  const [hallAreaLabelPosition, setHallAreaLabelPosition] = useState<{ x: number; y: number } | null>(initialHallAreaLabelPosition);
  const [selectedLineIdx, setSelectedLineIdx] = useState<number | null>(null);
  const [orthogonalLineMode, setOrthogonalLineMode] = useState(true);
  const [elementsMoveLocked, setElementsMoveLocked] = useState(false);
  const [newHallShape, setNewHallShape] = useState<HallShape>('rect');
  const [hallDraft, setHallDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [isDrawingHall, setIsDrawingHall] = useState(false);
  const [hallSizeLocked, setHallSizeLocked] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, Edge> | null>(null);
  const isFirstRender = useRef(true);
  const flowCanvasRef = useRef<HTMLDivElement | null>(null);
  const hallAreaLabelDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hallAreaLabelDraggingRef = useRef(false);

  useEffect(() => {
    setLocalMachines(machines ?? []);
  }, [machines]);

  const addWarehouse = useCallback(() => {
    const id = `warehouse-${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        position: { x: 120, y: 120 },
        data: { label: "Magazyn", kind: 'warehouse' },
        style: {
          border: "1px solid #a16207",
          borderRadius: 8,
          padding: 8,
          fontSize: 12,
          background: "#fef9c3",
          width: 180,
          height: 80,
        },
      },
    ]);
  }, [setNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => String(n.id) === String(selectedNodeId)) ?? null;
  }, [nodes, selectedNodeId]);

  const canResizeSelectedNode = useMemo(() => {
    if (!selectedNode) return false;
    const kind = String((selectedNode.data as any)?.kind ?? '');
    const id = String(selectedNode.id);
    const isMachine = kind === 'machine' || /^\d+$/.test(id);
    const isWarehouse = kind === 'warehouse' || id.startsWith('warehouse-');
    const isHall = kind === 'hall-area' || id.startsWith('hall-area-');
    return isMachine || isWarehouse || isHall;
  }, [selectedNode]);

  const isSelectedHall = useMemo(() => {
    if (!selectedNode) return false;
    const kind = String((selectedNode.data as any)?.kind ?? '');
    const id = String(selectedNode.id);
    return kind === 'hall-area' || id.startsWith('hall-area-');
  }, [selectedNode]);

  const isSelectedRoad = useMemo(() => {
    if (!selectedNode) return false;
    const kind = String((selectedNode.data as any)?.kind ?? '');
    const id = String(selectedNode.id);
    return kind === 'road' || id.startsWith('road-');
  }, [selectedNode]);

  const isSelectedDoor = useMemo(() => {
    if (!selectedNode) return false;
    const kind = String((selectedNode.data as any)?.kind ?? '');
    const id = String(selectedNode.id);
    return kind === 'hall-door' || id.startsWith('hall-door-');
  }, [selectedNode]);

  const getNodeSize = useCallback((node: Node | null) => {
    if (!node) return { width: 180, height: 90 };

    const rawWidth = (node.style as any)?.width;
    const rawHeight = (node.style as any)?.height;
    const kind = String((node.data as any)?.kind ?? '');
    const id = String(node.id);
    const isWarehouse = kind === 'warehouse' || id.startsWith('warehouse-');

    const width = typeof rawWidth === 'number' ? rawWidth : parseInt(String(rawWidth ?? ''), 10) || 180;
    const fallbackHeight = isWarehouse ? 80 : 90;
    const height = typeof rawHeight === 'number' ? rawHeight : parseInt(String(rawHeight ?? ''), 10) || fallbackHeight;

    return { width, height };
  }, []);

  const resizeSelectedNode = useCallback((axis: 'width' | 'height', delta: number) => {
    if (!selectedNodeId) return;

    setNodes((current) =>
      current.map((node) => {
        if (String(node.id) !== String(selectedNodeId)) return node;

        const size = getNodeSize(node);
        // If hall size is locked, prevent resizing
        const kind = String((node.data as any)?.kind ?? '');
        const id = String(node.id);
        const isHall = kind === 'hall-area' || id.startsWith('hall-area-');
        if (isHall && hallSizeLocked) return node;

        const nextSize = {
          width: axis === 'width' ? Math.max(80, size.width + delta) : size.width,
          height: axis === 'height' ? Math.max(60, size.height + delta) : size.height,
        };

        const isMachine = kind === 'machine' || /^\d+$/.test(id);
        const hallShape = ((node.data as any)?.hallShape as HallShape | undefined) ?? 'rect';

        return {
          ...node,
          data: isHall
            ? {
                ...(node.data ?? {}),
                label: `Hala ${Math.round(nextSize.width)} x ${Math.round(nextSize.height)}`,
              }
            : node.data,
          style: isHall
            ? {
                ...buildHallAreaStyle(nextSize.width, nextSize.height, hallShape),
                ...(node.style ?? {}),
                width: nextSize.width,
                height: nextSize.height,
              }
            : isMachine
              ? {
                ...buildMachineNodeStyle(nextSize.width, nextSize.height),
                ...(node.style ?? {}),
                width: nextSize.width,
                height: nextSize.height,
              }
              : {
                ...(node.style ?? {}),
                width: nextSize.width,
                height: nextSize.height,
              },
        };
      }),
    );
  }, [getNodeSize, selectedNodeId, setNodes, hallSizeLocked]);
  // Delete selected hall
  const deleteSelectedHall = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => String(node.id) !== String(selectedNodeId)));
    setEdges((current) => current.filter((edge) => String(edge.source) !== String(selectedNodeId) && String(edge.target) !== String(selectedNodeId)));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  const deleteSelectedRoad = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((current) => current.filter((node) => String(node.id) !== String(selectedNodeId)));
    setEdges((current) => current.filter((edge) => String(edge.source) !== String(selectedNodeId) && String(edge.target) !== String(selectedNodeId)));
    setSelectedNodeId(null);
  }, [selectedNodeId, setEdges, setNodes]);

  const deleteAllRoads = useCallback(() => {
    const roadIds = new Set(
      nodes
        .filter((node) => {
          const kind = String((node.data as any)?.kind ?? '');
          const id = String(node.id);
          return kind === 'road' || id.startsWith('road-');
        })
        .map((node) => String(node.id)),
    );

    if (roadIds.size === 0) return;

    setNodes((current) => current.filter((node) => !roadIds.has(String(node.id))));
    setEdges((current) => current.filter((edge) => !roadIds.has(String(edge.source)) && !roadIds.has(String(edge.target))));
    if (selectedNodeId && roadIds.has(String(selectedNodeId))) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId, setEdges, setNodes]);

  const addDoorToSelectedHall = useCallback(() => {
    if (!selectedNode) return;

    const kind = String((selectedNode.data as any)?.kind ?? '');
    const id = String(selectedNode.id);
    const isHall = kind === 'hall-area' || id.startsWith('hall-area-');
    if (!isHall) return;

    const size = getNodeSize(selectedNode);
    const doorId = `hall-door-${Date.now()}`;
    const doorX = selectedNode.position.x + Math.round(size.width / 2) - 14;
    const doorY = selectedNode.position.y + Math.round(size.height) - 8;

    setNodes((current) => [
      ...current,
      {
        id: doorId,
        position: { x: doorX, y: doorY },
        data: { label: 'D', kind: 'hall-door', hallId: String(selectedNode.id) },
        style: {
          width: 28,
          height: 16,
          borderRadius: 6,
          border: '2px solid #166534',
          background: '#86efac',
          color: '#14532d',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
      },
    ]);
  }, [getNodeSize, selectedNode, setNodes]);

  const deleteSelectedDoor = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => String(node.id) !== String(selectedNodeId)));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  const changeSelectedHallShape = useCallback((shape: HallShape) => {
    if (!selectedNodeId) return;

    setNodes((current) =>
      current.map((node) => {
        if (String(node.id) !== String(selectedNodeId)) return node;

        const kind = String((node.data as any)?.kind ?? '');
        const id = String(node.id);
        const isHall = kind === 'hall-area' || id.startsWith('hall-area-');
        if (!isHall) return node;

        const size = getNodeSize(node);
        return {
          ...node,
          data: {
            ...(node.data ?? {}),
            hallShape: shape,
          },
          style: {
            ...buildHallAreaStyle(size.width, size.height, shape),
            ...(node.style ?? {}),
            width: size.width,
            height: size.height,
          },
        };
      }),
    );
  }, [getNodeSize, selectedNodeId, setNodes]);

  const addRoadHorizontal = useCallback(() => {
    const id = `road-h-${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        position: { x: 160, y: 120 },
        data: { label: '', kind: 'road', orientation: 'horizontal'},
        style: buildRoadNodeStyle('horizontal', ROAD_LENGTH, ROAD_THICKNESS),
      },
    ]);
  }, [ROAD_LENGTH, ROAD_THICKNESS, setNodes]);

  const addRoadVertical = useCallback(() => {
    const id = `road-v-${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        position: { x: 260, y: 120 },
        data: { label: '', kind: 'road', orientation: 'vertical' },
        style: buildRoadNodeStyle('vertical', ROAD_LENGTH, ROAD_THICKNESS),
      },
    ]);
  }, [ROAD_LENGTH, ROAD_THICKNESS, setNodes]);

  const getFlowPositionFromMouse = useCallback((event: React.MouseEvent) => {
    if (!rfInstance) return null;
    return rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
  }, [rfInstance]);

  const flowToCanvasPoint = useCallback((point: { x: number; y: number }) => {
    if (!rfInstance) return point;
    const rect = flowCanvasRef.current?.getBoundingClientRect();
    const screen = rfInstance.flowToScreenPosition(point);
    if (!rect) return screen;
    return {
      x: screen.x - rect.left,
      y: screen.y - rect.top,
    };
  }, [rfInstance]);

  // Paint-like hall drawing with lines
  // Find nearest point for snapping
  const getNearestPoint = useCallback((pos: {x:number;y:number}, points: {x:number;y:number}[], threshold=18) => {
    let nearest = null, minDist = threshold;
    for(const p of points){
      const d = Math.sqrt((p.x-pos.x)**2 + (p.y-pos.y)**2);
      if(d < minDist){ minDist = d; nearest = p; }
    }
    return nearest || pos;
  }, []);

  const onPaneMouseDown = useCallback((event: React.MouseEvent) => {
    if (!drawHallMode || buildClosedPolygonFromLines(hallLines)) return;
    const position = getFlowPositionFromMouse(event);
    if (!position) return;

    event.preventDefault();
    setSelectedNodeId(null);
    setIsDrawingHall(true);
    // Snap start to nearest existing point
    const allPoints = hallLines.flatMap(l => [l.start, l.end]);
    const snappedStart = getNearestPoint(position, allPoints);
    setHallLineDraft({ start: snappedStart, end: snappedStart });
  }, [drawHallMode, getFlowPositionFromMouse, hallLines, getNearestPoint]);

  const onPaneMouseMove = useCallback((event: React.MouseEvent) => {
    if (!drawHallMode || !hallLineDraft || !isDrawingHall) return;
    const position = getFlowPositionFromMouse(event);
    if (!position) return;

    // Snap end to nearest existing point
    const allPoints = hallLines.flatMap(l => [l.start, l.end]);
    const snappedEnd = getNearestPoint(position, allPoints);
    const dx = snappedEnd.x - hallLineDraft.start.x;
    const dy = snappedEnd.y - hallLineDraft.start.y;
    const leveledEnd = orthogonalLineMode
      ? (Math.abs(dx) >= Math.abs(dy)
        ? { x: snappedEnd.x, y: hallLineDraft.start.y }
        : { x: hallLineDraft.start.x, y: snappedEnd.y })
      : snappedEnd;
    setHallLineDraft((current) => {
      if (!current) return current;
      return { ...current, end: leveledEnd };
    });
  }, [drawHallMode, getFlowPositionFromMouse, hallLineDraft, isDrawingHall, hallLines, getNearestPoint, orthogonalLineMode]);

  const onPaneMouseUp = useCallback(() => {
    if (!drawHallMode || !hallLineDraft || !isDrawingHall) return;

    setIsDrawingHall(false);
    setHallLineDraft(null);

    // Add the drawn line to hallLines
    setHallLines((lines) => [...lines, hallLineDraft]);
  }, [drawHallMode, hallLineDraft, isDrawingHall]);

  // Delete selected line
  const deleteSelectedLine = useCallback(() => {
    if(selectedLineIdx===null) return;
    setHallLines(lines => lines.filter((_,idx)=>idx!==selectedLineIdx));
    setSelectedLineIdx(null);
  }, [selectedLineIdx]);

  const deleteLastHallLine = useCallback(() => {
    setHallLines((lines) => {
      if (lines.length === 0) return lines;
      return lines.slice(0, -1);
    });
    setSelectedLineIdx(null);
  }, []);

  const deleteAllHallLines = useCallback(() => {
    setHallLines([]);
    setSelectedLineIdx(null);
    setHallLineDraft(null);
    setIsDrawingHall(false);
    setHallAreaLabelPosition(null);
  }, []);

  const beginDragHallAreaLabel = useCallback((event: React.MouseEvent, currentPosition: { x: number; y: number }) => {
    if (elementsMoveLocked || !rfInstance) return;

    event.preventDefault();
    event.stopPropagation();

    const pointerFlow = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    hallAreaLabelDragOffsetRef.current = {
      x: pointerFlow.x - currentPosition.x,
      y: pointerFlow.y - currentPosition.y,
    };
    hallAreaLabelDraggingRef.current = true;
  }, [elementsMoveLocked, rfInstance]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!hallAreaLabelDraggingRef.current || !rfInstance || elementsMoveLocked) return;

      const pointerFlow = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setHallAreaLabelPosition({
        x: pointerFlow.x - hallAreaLabelDragOffsetRef.current.x,
        y: pointerFlow.y - hallAreaLabelDragOffsetRef.current.y,
      });
    };

    const onMouseUp = () => {
      hallAreaLabelDraggingRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [elementsMoveLocked, rfInstance]);

  // Paint-like: no draft node, just lines
  const renderedNodes = useMemo<Node[]>(() => nodes, [nodes]);

  const closedHallPolygonPoints = useMemo(() => {
    return buildClosedPolygonFromLines(hallLines);
  }, [hallLines]);

  const closedHallBounds = useMemo(() => {
    if (!closedHallPolygonPoints || closedHallPolygonPoints.length < 4) return null;

    const points = closedHallPolygonPoints.slice(0, -1);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [closedHallPolygonPoints]);

  const drawnHallBounds = useMemo(() => {
    if (hallLines.length === 0) return null;

    const points = hallLines.flatMap((line) => [line.start, line.end]);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [hallLines]);

  const isHallOutlineClosed = Boolean(closedHallBounds);

  const clampNodePositionToHallBounds = useCallback((node: Node) => {
    if (!closedHallBounds) return node;

    const size = getNodeSize(node);
    const minX = closedHallBounds.minX;
    const maxX = closedHallBounds.maxX - size.width;
    const minY = closedHallBounds.minY;
    const maxY = closedHallBounds.maxY - size.height;

    const nextX = maxX >= minX
      ? Math.min(Math.max(node.position.x, minX), maxX)
      : minX;
    const nextY = maxY >= minY
      ? Math.min(Math.max(node.position.y, minY), maxY)
      : minY;

    if (nextX === node.position.x && nextY === node.position.y) {
      return node;
    }

    return {
      ...node,
      position: {
        x: nextX,
        y: nextY,
      },
    };
  }, [closedHallBounds, getNodeSize]);

  const onNodesChangeConstrained = useCallback((changes: NodeChange<Node>[]) => {
    setNodes((currentNodes) => {
      const nextNodes = applyNodeChanges(changes, currentNodes);
      if (!closedHallBounds) return nextNodes;
      return nextNodes.map((node) => clampNodePositionToHallBounds(node));
    });
  }, [clampNodePositionToHallBounds, closedHallBounds, setNodes]);

  useEffect(() => {
    if (!rfInstance || !drawnHallBounds) return;

    const width = Math.max(1, drawnHallBounds.maxX - drawnHallBounds.minX);
    const height = Math.max(1, drawnHallBounds.maxY - drawnHallBounds.minY);

    rfInstance.fitBounds(
      {
        x: drawnHallBounds.minX,
        y: drawnHallBounds.minY,
        width,
        height,
      },
      {
        padding: 0.05,
        duration: 250,
      },
    );
  }, [drawnHallBounds, rfInstance]);


  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            label: "droga",
            style: { stroke: "#2563eb", strokeWidth: 2 },
          },
          current,
        ),
      );
    },
    [setEdges],
  );

  const buildLayoutPayload = useCallback(() => {
    const safeEdges = Array.isArray(edges) ? edges : [];

    return {
      nodes: nodes.map((node) => ({
        id: String(node.id),
        type: node.type,
        position: node.position,
        data: {
          ...(sanitizeForJson((node.data ?? {}) as Record<string, unknown>) as Record<string, unknown>),
          label: typeof (node.data as any)?.label === 'string' ? (node.data as any).label : null,
        },
        style: (sanitizeForJson((node.style ?? {}) as Record<string, unknown>) as Record<string, unknown>),
      })),
      edges: safeEdges.map((edge) => ({
        id: String(edge.id),
        source: String(edge.source),
        target: String(edge.target),
        type: edge.type,
        label: edge.label ? String(edge.label) : null,
        animated: Boolean(edge.animated),
        style: (sanitizeForJson((edge.style ?? {}) as Record<string, unknown>) as Record<string, unknown>),
      })),
      hall_lines: hallLines.map((line) => ({
        start: {
          x: Number(line.start.x) || 0,
          y: Number(line.start.y) || 0,
        },
        end: {
          x: Number(line.end.x) || 0,
          y: Number(line.end.y) || 0,
        },
      })),
      hall_area_label_pos: hallAreaLabelPosition
        ? {
            x: Number(hallAreaLabelPosition.x) || 0,
            y: Number(hallAreaLabelPosition.y) || 0,
          }
        : null,
    };
  }, [nodes, edges, hallAreaLabelPosition, hallLines]);

  const saveLayout = useCallback(async () => {
    if (!department?.id) return;

    setSaving(true);
    setSaveMessage("");
    try {
      await axios.post(`/moderator/departments/${department.id}/hall-layout`, buildLayoutPayload());
      setSaveMessage("Układ zapisany");
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const status = error?.response?.status;
      if (serverMessage) {
        setSaveMessage(`Błąd zapisu: ${serverMessage}`);
      } else if (status) {
        setSaveMessage(`Błąd zapisu (HTTP ${status})`);
      } else {
        setSaveMessage("Błąd zapisu");
      }
    } finally {
      setSaving(false);
    }
  }, [buildLayoutPayload, department?.id]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void saveLayout();
    }, 900);

    return () => clearTimeout(timer);
  }, [nodes, edges, hallAreaLabelPosition, hallLines, saveLayout]);

  const breadcrumbs = [
    { label: "Moderator", href: "/moderator" },
    { label: "Działy", href: "/moderator/departments" },
    { label: "Podgląd hali", href: "#" },
  ];

  return (
    <ModeratorLayout breadcrumbs={breadcrumbs} title={`Podgląd hali: ${department.name ?? "-"}`}>
      <div className="p-4 space-y-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">Podgląd hali oparty o React Flow — możesz przeciągać maszyny i układać layout.</div>
          <div className="mt-2 text-sm">
            <span className="font-semibold">Wydział:</span> {department.name ?? "-"}
          </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-3">Układ hali (React Flow)</h3>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addWarehouse}
                className="px-3 py-1 text-sm rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                Dodaj magazyn
              </button>
              <button
                type="button"
                onClick={addRoadHorizontal}
                className="px-3 py-1 text-sm rounded bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                Dodaj drogę poziomą
              </button>
              <button
                type="button"
                onClick={addRoadVertical}
                className="px-3 py-1 text-sm rounded bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                Dodaj drogę pionową
              </button>
              <button
                type="button"
                onClick={deleteAllRoads}
                className="px-3 py-1 text-sm rounded bg-red-50 text-red-700 hover:bg-red-100"
              >
                Usuń wszystkie drogi
              </button>
              <button
                type="button"
                onClick={addDoorToSelectedHall}
                className="px-3 py-1 text-sm rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                disabled={!isSelectedHall}
              >
                Zaznacz drzwi wjazdowe
              </button>
              <button
                type="button"
                onClick={() => void saveLayout()}
                className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {saving ? "Zapisywanie..." : "Zapisz układ"}
              </button>
              <button
                type="button"
                onClick={() => setElementsMoveLocked((current) => !current)}
                className={`px-3 py-1 text-sm rounded ${elementsMoveLocked ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
              >
                {elementsMoveLocked ? 'Odblokuj przesuwanie elementów' : 'Zablokuj przesuwanie elementów'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawHallMode((current) => !current);
                  setHallDraft(null);
                  setIsDrawingHall(false);
                  setSelectedLineIdx(null);
                }}
                className={`px-3 py-1 text-sm rounded ${drawHallMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
              >
                {drawHallMode ? 'Tryb rysowania hali: ON' : 'Rysuj rozmiar hali (paint)'}
              </button>
              <button
                type="button"
                onClick={deleteLastHallLine}
                className="px-3 py-1 text-sm rounded bg-red-50 text-red-700 hover:bg-red-100"
                disabled={hallLines.length === 0 || isHallOutlineClosed}
              >
                Usuń ostatnią linię hali
              </button>
              <button
                type="button"
                onClick={deleteAllHallLines}
                className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                disabled={(hallLines.length === 0 && !hallLineDraft) || isHallOutlineClosed}
              >
                Usuń wszystkie linie hali
              </button>
              {drawHallMode && (
                <select
                  value={newHallShape}
                  onChange={(event) => setNewHallShape(event.target.value as HallShape)}
                  className="px-2 py-1 text-sm rounded border bg-white text-gray-700"
                >
                  <option value="rect">Kształt hali: Prostokąt</option>
                  <option value="rounded">Kształt hali: Zaokrąglony</option>
                  <option value="ellipse">Kształt hali: Elipsa</option>
                </select>
              )}
              {drawHallMode && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={orthogonalLineMode}
                    onChange={(event) => setOrthogonalLineMode(event.target.checked)}
                  />
                  Poziomowanie linii do osi (H/V)
                </label>
              )}
              <span className="text-xs text-gray-500">Przeciągaj elementy myszką. Łącz uchwyty między elementami, aby dorysować drogę/połączenie.</span>
              {drawHallMode && <span className="text-xs text-indigo-700">Kliknij i przeciągnij na planszy, aby narysować linię obrysu hali.</span>}
              {isHallOutlineClosed && <span className="text-xs text-emerald-700">Obrys hali zamknięty — nie można rysować poza jej obrębem.</span>}
              {saveMessage && <span className="text-xs text-green-700">{saveMessage}</span>}
            </div>
            {canResizeSelectedNode && selectedNode && (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded border bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-700">
                  Zaznaczony: {isSelectedHall ? 'Hala' : String((selectedNode.data as any)?.kind ?? '').startsWith('warehouse') || String(selectedNode.id).startsWith('warehouse-') ? 'Magazyn' : 'Maszyna'}
                </span>
                {isSelectedHall && (
                  <>
                    <select
                      value={(((selectedNode.data as any)?.hallShape as HallShape | undefined) ?? 'rect')}
                      onChange={(event) => changeSelectedHallShape(event.target.value as HallShape)}
                      className="px-2 py-1 text-sm rounded border bg-white text-gray-700"
                    >
                      <option value="rect">Prostokąt</option>
                      <option value="rounded">Zaokrąglony</option>
                      <option value="ellipse">Elipsa</option>
                    </select>
                    <label className="ml-3 flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={hallSizeLocked} onChange={e => setHallSizeLocked(e.target.checked)} />
                      Zablokuj rozmiar hali
                    </label>
                    <button
                      type="button"
                      onClick={deleteSelectedHall}
                      className="ml-3 px-2 py-1 rounded border bg-red-100 text-red-800"
                    >Usuń halę</button>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Szerokość</span>
                  <button type="button" onClick={() => resizeSelectedNode('width', -10)} className="px-2 py-1 rounded border bg-white hover:bg-gray-100" disabled={isSelectedHall && hallSizeLocked}>-</button>
                  <span className="w-12 text-center">{getNodeSize(selectedNode).width}px</span>
                  <button type="button" onClick={() => resizeSelectedNode('width', 10)} className="px-2 py-1 rounded border bg-white hover:bg-gray-100" disabled={isSelectedHall && hallSizeLocked}>+</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Wysokość</span>
                  <button type="button" onClick={() => resizeSelectedNode('height', -10)} className="px-2 py-1 rounded border bg-white hover:bg-gray-100" disabled={isSelectedHall && hallSizeLocked}>-</button>
                  <span className="w-12 text-center">{getNodeSize(selectedNode).height}px</span>
                  <button type="button" onClick={() => resizeSelectedNode('height', 10)} className="px-2 py-1 rounded border bg-white hover:bg-gray-100" disabled={isSelectedHall && hallSizeLocked}>+</button>
                </div>
              </div>
            )}
            {isSelectedRoad && (
              <div className="mb-3 flex items-center gap-2 rounded border bg-red-50 px-3 py-2 text-sm">
                <span className="text-red-800">Zaznaczono drogę</span>
                <button
                  type="button"
                  onClick={deleteSelectedRoad}
                  className="px-2 py-1 rounded border border-red-200 bg-white text-red-700 hover:bg-red-100"
                >
                  Usuń wybraną drogę
                </button>
              </div>
            )}
            {isSelectedDoor && (
              <div className="mb-3 flex items-center gap-2 rounded border bg-emerald-50 px-3 py-2 text-sm">
                <span className="text-emerald-800">Zaznaczono drzwi wjazdowe</span>
                <button
                  type="button"
                  onClick={deleteSelectedDoor}
                  className="px-2 py-1 rounded border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
                >
                  Usuń zaznaczone drzwi
                </button>
              </div>
            )}
            <div className="w-full h-[560px] border rounded overflow-hidden">
              <div ref={flowCanvasRef} className="relative w-full h-full">
                <ReactFlow
                  nodes={renderedNodes}
                  edges={edges}
                  onNodesChange={onNodesChangeConstrained}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={(_, node) => setSelectedNodeId(String(node.id))}
                  onPaneClick={() => setSelectedNodeId(null)}
                  onConnect={onConnect}
                  onInit={setRfInstance}
                  nodesDraggable={!elementsMoveLocked}
                  panOnDrag={!elementsMoveLocked}
                  zoomOnScroll={!elementsMoveLocked}
                  zoomOnPinch={!elementsMoveLocked}
                  zoomOnDoubleClick={!elementsMoveLocked}
                  onMove={onMove}
                >
                  <MiniMap />
                  <Controls showFitView={!elementsMoveLocked} />
                  <Background gap={16} size={1} />
                </ReactFlow>

                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 12 }}>
                  {hallLines.map((line, idx) => {
                    const start = flowToCanvasPoint(line.start);
                    const end = flowToCanvasPoint(line.end);
                    return (
                      <g key={`hall-line-${idx}`}>
                        <line
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke={selectedLineIdx === idx ? '#dc2626' : '#2563eb'}
                          strokeWidth={selectedLineIdx === idx ? 6 : 4}
                          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                          onClick={() => setSelectedLineIdx(idx)}
                        />
                        <circle cx={start.x} cy={start.y} r={7} fill="#fbbf24" stroke="#2563eb" strokeWidth={2} />
                        <circle cx={end.x} cy={end.y} r={7} fill="#38bdf8" stroke="#2563eb" strokeWidth={2} />
                      </g>
                    );
                  })}

                  {hallLineDraft && isDrawingHall && (() => {
                    const start = flowToCanvasPoint(hallLineDraft.start);
                    const end = flowToCanvasPoint(hallLineDraft.end);
                    return (
                      <g>
                        <line
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="#1d4ed8"
                          strokeWidth={3}
                          strokeDasharray="8 4"
                        />
                        <circle cx={start.x} cy={start.y} r={6} fill="#fbbf24" stroke="#1d4ed8" strokeWidth={2} />
                        <circle cx={end.x} cy={end.y} r={6} fill="#38bdf8" stroke="#1d4ed8" strokeWidth={2} />
                      </g>
                    );
                  })()}
                </svg>

                {hallLines.map((line, idx) => {
                  const lengthPx = Math.sqrt((line.end.x - line.start.x) ** 2 + (line.end.y - line.start.y) ** 2);
                  const lengthM = Math.round((lengthPx / PX_PER_METER) * 10) / 10;
                  const midFlow = { x: (line.start.x + line.end.x) / 2, y: (line.start.y + line.end.y) / 2 };
                  const mid = flowToCanvasPoint(midFlow);
                  return (
                    <div
                      key={`hall-line-label-${idx}`}
                      style={{
                        position: 'absolute',
                        left: mid.x,
                        top: mid.y - 24,
                        transform: 'translateX(-50%)',
                        background: '#fff',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #2563eb',
                        pointerEvents: 'none',
                        zIndex: 14,
                      }}
                    >
                      {lengthM} m
                    </div>
                  );
                })}

                {hallLineDraft && isDrawingHall && (() => {
                  const lengthPx = Math.sqrt((hallLineDraft.end.x - hallLineDraft.start.x) ** 2 + (hallLineDraft.end.y - hallLineDraft.start.y) ** 2);
                  const lengthM = Math.round((lengthPx / PX_PER_METER) * 10) / 10;
                  const midFlow = { x: (hallLineDraft.start.x + hallLineDraft.end.x) / 2, y: (hallLineDraft.start.y + hallLineDraft.end.y) / 2 };
                  const mid = flowToCanvasPoint(midFlow);
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: mid.x,
                        top: mid.y - 24,
                        transform: 'translateX(-50%)',
                        background: '#fff',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #1d4ed8',
                        pointerEvents: 'none',
                        zIndex: 14,
                      }}
                    >
                      {lengthM} m
                    </div>
                  );
                })()}

                {nodes
                  .filter((node) => {
                    const kind = String((node.data as any)?.kind ?? '');
                    const id = String(node.id);
                    return kind === 'hall-area' || id.startsWith('hall-area-');
                  })
                  .map((node) => {
                    const size = getNodeSize(node);
                    const areaM2 = Math.round(((size.width * size.height) / (PX_PER_METER * PX_PER_METER)) * 10) / 10;
                    const topCenterFlow = {
                      x: node.position.x + size.width / 2,
                      y: node.position.y,
                    };
                    const topCenter = flowToCanvasPoint(topCenterFlow);

                    return (
                      <div
                        key={`hall-node-area-${String(node.id)}`}
                        style={{
                          position: 'absolute',
                          left: topCenter.x,
                          top: topCenter.y - 30,
                          transform: 'translateX(-50%)',
                          background: '#fff',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: '1px solid #22c55e',
                          pointerEvents: 'none',
                          zIndex: 14,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Powierzchnia: {areaM2} m²
                      </div>
                    );
                  })}

                {closedHallPolygonPoints && (() => {
                  const points = closedHallPolygonPoints;
                  let areaPx = 0;
                  for (let index = 0; index < points.length - 1; index += 1) {
                    areaPx += points[index].x * points[index + 1].y - points[index + 1].x * points[index].y;
                  }
                  areaPx = Math.abs(areaPx / 2);
                  if (areaPx <= 0) return null;

                  const areaM2 = Math.round((areaPx / (PX_PER_METER * PX_PER_METER)) * 10) / 10;
                  const centerFlow = {
                    x: points.slice(0, -1).reduce((acc, point) => acc + point.x, 0) / (points.length - 1),
                    y: points.slice(0, -1).reduce((acc, point) => acc + point.y, 0) / (points.length - 1),
                  };
                  const labelFlowPosition = hallAreaLabelPosition ?? centerFlow;
                  const center = flowToCanvasPoint(labelFlowPosition);
                  const canvasRect = flowCanvasRef.current?.getBoundingClientRect();
                  const canvasWidth = canvasRect?.width ?? 0;
                  const canvasHeight = canvasRect?.height ?? 0;
                  const safeLeft = canvasWidth > 0
                    ? Math.max(70, Math.min(center.x, canvasWidth - 70))
                    : center.x;
                  const safeTop = canvasHeight > 0
                    ? Math.max(8, Math.min(center.y - 44, canvasHeight - 34))
                    : center.y - 44;

                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: safeLeft,
                        top: safeTop,
                        transform: 'translateX(-50%)',
                        background: '#fff',
                        color: '#16a34a',
                        fontWeight: 700,
                        fontSize: 15,
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '2px solid #16a34a',
                        pointerEvents: 'auto',
                        cursor: elementsMoveLocked ? 'default' : 'grab',
                        zIndex: 14,
                      }}
                      onMouseDown={(event) => beginDragHallAreaLabel(event, labelFlowPosition)}
                    >
                      Powierzchnia: {areaM2} m²
                    </div>
                  );
                })()}

                {selectedLineIdx !== null && (
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      left: 20,
                      top: 20,
                      zIndex: 30,
                      padding: '6px 16px',
                      background: '#dc2626',
                      color: '#fff',
                      borderRadius: 8,
                      fontWeight: 700,
                      border: 'none',
                      boxShadow: '0 2px 8px #0002',
                    }}
                    onClick={deleteSelectedLine}
                  >
                    Usuń wybraną linię
                  </button>
                )}

                {drawHallMode && (
                  <div
                    className="absolute inset-0 z-20 cursor-crosshair"
                    onMouseDown={onPaneMouseDown}
                    onMouseMove={onPaneMouseMove}
                    onMouseUp={onPaneMouseUp}
                    onMouseLeave={() => {
                      if (isDrawingHall) {
                        onPaneMouseUp();
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Przypisane maszyny</h3>
          {localMachines.length === 0 ? (
            <p className="text-sm text-gray-500">Brak przypisanych maszyn.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {localMachines.map((machine: any) => (
                <div key={machine.id} className="border rounded p-3 bg-white flex gap-3">
                  <div className="w-20 h-20 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                    {machine.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={machine.image_url} alt={machine.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-xs text-gray-400">Brak zdjęcia</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-semibold text-gray-800">{machine.name ?? 'Maszyna'}</div>
                      <div className="text-xs text-gray-500">{machine.barcode ?? ''}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{machine.model ?? 'Model'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Wrench className="w-4 h-4 text-indigo-500" />
                        <span>{machine.model ?? '-'}</span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{machine.owner?.name ?? machine.assigned_user?.name ?? 'Brak przypisania'}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Link href={`/moderator/machines/${machine.id}/edit`} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Szczegóły</Link>
                      <Link href={`/machines/failures?machine_id=${machine.id}`} className="px-2 py-1 text-xs rounded bg-red-50 text-red-700">Awarie ({machine.count_of_failures ?? 0})</Link>
                      <button
                        onClick={async () => {
                          try {
                            const ok = window.confirm(`Czy na pewno usunąć maszynę "${machine.name}"?`);
                            if (!ok) return;
                            setActionMessage('Usuwanie...');
                            // call destroy API
                            await axios.delete(`/moderator/machines/${machine.id}`);
                            // remove node and connected edges from layout
                            const nodeId = String(machine.id);
                            setNodes((curr) => curr.filter((n) => String(n.id) !== nodeId));
                            setEdges((curr) => curr.filter((e) => String(e.source) !== nodeId && String(e.target) !== nodeId));
                            // remove from local machines
                            setLocalMachines((curr: any[]) => curr.filter((m) => String(m.id) !== String(machine.id)));
                            setActionMessage('Usunięto');
                            // autosave layout
                            void saveLayout();
                          } catch (err) {
                            console.error(err);
                            setActionMessage('Błąd usuwania');
                          } finally {
                            setTimeout(() => setActionMessage(''), 2200);
                          }
                        }}
                        className="ml-auto px-2 py-1 text-xs rounded bg-red-100 text-red-800"
                      >
                        <Trash2 className="w-4 h-4 inline-block mr-1" />Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionMessage && <div className="mt-2 text-sm text-gray-600">{actionMessage}</div>}
        </div>

        <div>
          <Link href="/moderator/departments" className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">
            Wróć do działów
          </Link>
        </div>
      </div>
    </ModeratorLayout>
  );
}
