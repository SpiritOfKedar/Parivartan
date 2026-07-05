"use client";

import Konva from "konva";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { Image, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import {
  DEFAULT_ADJUSTMENTS,
  type FilterPreset,
  type PhotoAdjustments,
} from "../lib/photo-editor";

export type EditorTool = "select" | "crop" | "text" | "draw";

export interface PhotoEditorCanvasHandle {
  undo: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  applyCrop: () => void;
  getStage: () => Konva.Stage | null;
}

interface PhotoEditorCanvasProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  tool: EditorTool;
  adjustments: PhotoAdjustments;
  filterPreset: FilterPreset;
  textValue: string;
  textColor: string;
  textSize: number;
  brushColor: string;
  brushSize: number;
  maxWidth: number;
}

interface HistoryEntry {
  rotation: number;
  scaleX: number;
  scaleY: number;
  lines: { points: number[]; color: string; size: number }[];
  texts: {
    id: string;
    x: number;
    y: number;
    text: string;
    fill: string;
    fontSize: number;
  }[];
}

function computeDisplaySize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
): { width: number; height: number; scale: number } {
  const scale = Math.min(1, maxWidth / naturalWidth);
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
    scale,
  };
}

function applyImageFilters(
  node: Konva.Image,
  adjustments: PhotoAdjustments,
  filterPreset: FilterPreset,
) {
  node.clearCache();
  const filters = [
    Konva.Filters.Brighten,
    Konva.Filters.Contrast,
    Konva.Filters.HSL,
  ] as unknown as ((this: Konva.Node, imageData: ImageData) => void)[];

  if (
    filterPreset === "grayscale" ||
    filterPreset === "sepia" ||
    filterPreset === "vintage"
  ) {
    filters.push(
      Konva.Filters.Grayscale as unknown as (
        this: Konva.Node,
        imageData: ImageData,
      ) => void,
    );
  }

  node.filters(filters);
  node.brightness(adjustments.brightness / 100);
  node.contrast(adjustments.contrast);
  node.saturation(adjustments.saturation / 50);

  if (filterPreset === "grayscale") {
    node.saturation(-1);
  } else if (filterPreset === "sepia") {
    node.saturation(-0.35);
    node.contrast(adjustments.contrast - 10);
  } else if (filterPreset === "vintage") {
    node.saturation(adjustments.saturation / 50 - 0.35);
    node.contrast(adjustments.contrast - 15);
    node.brightness(adjustments.brightness / 100 - 0.05);
  } else if (filterPreset === "vivid") {
    node.saturation(adjustments.saturation / 50 + 0.45);
    node.contrast(adjustments.contrast + 20);
  }

  node.cache();
}

export const PhotoEditorCanvas = forwardRef<
  PhotoEditorCanvasHandle,
  PhotoEditorCanvasProps
>(function PhotoEditorCanvas(
  {
    imageUrl,
    naturalWidth,
    naturalHeight,
    tool,
    adjustments,
    filterPreset,
    textValue,
    textColor,
    textSize,
    brushColor,
    brushSize,
    maxWidth,
  },
  ref,
) {
  const stageRef = useRef<Konva.Stage>(null);
  const imageNodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cropTransformerRef = useRef<Konva.Transformer>(null);
  const cropRectRef = useRef<Konva.Rect>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null,
  );
  const [rotation, setRotation] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [lines, setLines] = useState<
    { points: number[]; color: string; size: number }[]
  >([]);
  const [textNodes, setTextNodes] = useState<
    {
      id: string;
      x: number;
      y: number;
      text: string;
      fill: string;
      fontSize: number;
    }[]
  >([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropRect, setCropRect] = useState({
    x: 40,
    y: 40,
    width: 200,
    height: 200,
  });

  const display = computeDisplaySize(naturalWidth, naturalHeight, maxWidth);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setImageElement(image);
    image.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    setCropRect({
      x: display.width * 0.1,
      y: display.height * 0.1,
      width: display.width * 0.8,
      height: display.height * 0.8,
    });
  }, [display.width, display.height]);

  useEffect(() => {
    const node = imageNodeRef.current;
    if (!node || !imageElement) {
      return;
    }
    applyImageFilters(node, adjustments, filterPreset);
  }, [adjustments, filterPreset, imageElement, rotation, scaleX, scaleY]);

  useEffect(() => {
    if (tool !== "select" || !selectedTextId) {
      transformerRef.current?.nodes([]);
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const selected = stage.findOne(`#${selectedTextId}`);
    if (selected) {
      transformerRef.current?.nodes([selected]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  }, [selectedTextId, tool, textNodes]);

  useEffect(() => {
    if (tool === "crop" && cropRectRef.current) {
      cropTransformerRef.current?.nodes([cropRectRef.current]);
      cropTransformerRef.current?.getLayer()?.batchDraw();
    }
  }, [tool, cropRect]);

  const pushHistory = useCallback(() => {
    setHistory((current) => [
      ...current.slice(-19),
      {
        rotation,
        scaleX,
        scaleY,
        lines: lines.map((line) => ({ ...line, points: [...line.points] })),
        texts: textNodes.map((node) => ({ ...node })),
      },
    ]);
  }, [lines, rotation, scaleX, scaleY, textNodes]);

  useImperativeHandle(ref, () => ({
    undo() {
      setHistory((current) => {
        const previous = current[current.length - 1];
        if (!previous) {
          return current;
        }
        setRotation(previous.rotation);
        setScaleX(previous.scaleX);
        setScaleY(previous.scaleY);
        setLines(previous.lines.map((line) => ({ ...line, points: [...line.points] })));
        setTextNodes(previous.texts.map((node) => ({ ...node })));
        return current.slice(0, -1);
      });
    },
    rotateLeft() {
      pushHistory();
      setRotation((value) => value - 90);
    },
    rotateRight() {
      pushHistory();
      setRotation((value) => value + 90);
    },
    flipHorizontal() {
      pushHistory();
      setScaleX((value) => value * -1);
    },
    flipVertical() {
      pushHistory();
      setScaleY((value) => value * -1);
    },
    applyCrop() {
      const stage = stageRef.current;
      const imageNode = imageNodeRef.current;
      if (!stage || !imageNode || !imageElement) {
        return;
      }

      pushHistory();

      const inverseScale = 1 / display.scale;
      const cropX = cropRect.x * inverseScale;
      const cropY = cropRect.y * inverseScale;
      const cropWidth = cropRect.width * inverseScale;
      const cropHeight = cropRect.height * inverseScale;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(cropWidth));
      canvas.height = Math.max(1, Math.round(cropHeight));
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const tempStage = new Konva.Stage({
        width: naturalWidth,
        height: naturalHeight,
        container: document.createElement("div"),
      });
      const tempLayer = new Konva.Layer();
      const tempImage = new Konva.Image({
        image: imageElement,
        width: naturalWidth,
        height: naturalHeight,
        rotation,
        scaleX,
        scaleY,
        offsetX: naturalWidth / 2,
        offsetY: naturalHeight / 2,
        x: naturalWidth / 2,
        y: naturalHeight / 2,
      });
      applyImageFilters(tempImage, adjustments, filterPreset);
      tempLayer.add(tempImage);
      tempStage.add(tempLayer);
      tempLayer.draw();

      const fullCanvas = tempStage.toCanvas({ pixelRatio: 1 });
      context.drawImage(
        fullCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      tempStage.destroy();

      const cropped = new window.Image();
      cropped.onload = () => {
        setImageElement(cropped);
        setRotation(0);
        setScaleX(1);
        setScaleY(1);
        setLines([]);
        setTextNodes([]);
      };
      cropped.src = canvas.toDataURL("image/png");
    },
    getStage() {
      return stageRef.current;
    },
  }));

  function handleStageMouseDown(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (tool === "draw") {
      pushHistory();
      setIsDrawing(true);
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const point = stage.getPointerPosition();
      if (!point) {
        return;
      }
      setLines([...lines, { points: [point.x, point.y], color: brushColor, size: brushSize }]);
      return;
    }

    if (tool === "text") {
      pushHistory();
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const point = stage.getPointerPosition();
      if (!point || !textValue.trim()) {
        return;
      }
      const id = `text-${Date.now()}`;
      setTextNodes([
        ...textNodes,
        {
          id,
          x: point.x,
          y: point.y,
          text: textValue,
          fill: textColor,
          fontSize: textSize,
        },
      ]);
      setSelectedTextId(id);
      return;
    }

    if (tool === "select") {
      const clickedOnEmpty = event.target === event.target.getStage();
      if (clickedOnEmpty) {
        setSelectedTextId(null);
      }
    }
  }

  function handleStageMouseMove() {
    if (!isDrawing || tool !== "draw") {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const point = stage.getPointerPosition();
    if (!point) {
      return;
    }

    setLines((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      if (!last) {
        return current;
      }
      last.points = last.points.concat([point.x, point.y]);
      return next;
    });
  }

  function handleStageMouseUp() {
    setIsDrawing(false);
  }

  if (!imageElement) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-border bg-background-subtle text-sm text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded border border-border bg-background-subtle p-3">
      <Stage
        ref={stageRef}
        width={display.width}
        height={display.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        className="mx-auto bg-background"
      >
        <Layer>
          <Image
            ref={imageNodeRef}
            image={imageElement}
            width={display.width}
            height={display.height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            offsetX={display.width / 2}
            offsetY={display.height / 2}
            x={display.width / 2}
            y={display.height / 2}
          />
          {lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.size}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {textNodes.map((node) => (
            <Text
              key={node.id}
              id={node.id}
              x={node.x}
              y={node.y}
              text={node.text}
              fill={node.fill}
              fontSize={node.fontSize}
              draggable={tool === "select"}
              onClick={() => setSelectedTextId(node.id)}
              onTap={() => setSelectedTextId(node.id)}
            />
          ))}
          {tool === "crop" && (
            <>
              <Rect
                ref={cropRectRef}
                x={cropRect.x}
                y={cropRect.y}
                width={cropRect.width}
                height={cropRect.height}
                stroke="#ffffff"
                strokeWidth={2}
                dash={[8, 4]}
                draggable
                onDragEnd={(event) => {
                  setCropRect({
                    ...cropRect,
                    x: event.target.x(),
                    y: event.target.y(),
                  });
                }}
                onTransformEnd={() => {
                  const node = cropRectRef.current;
                  if (!node) {
                    return;
                  }
                  const scaleXValue = node.scaleX();
                  const scaleYValue = node.scaleY();
                  setCropRect({
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(20, node.width() * scaleXValue),
                    height: Math.max(20, node.height() * scaleYValue),
                  });
                  node.scaleX(1);
                  node.scaleY(1);
                }}
              />
            </>
          )}
          {tool === "select" && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
          {tool === "crop" && (
            <Transformer
              ref={cropTransformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});
