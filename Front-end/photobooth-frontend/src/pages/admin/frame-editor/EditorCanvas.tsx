import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { message } from 'antd';
import { Group, Image as KonvaImage, Layer, Rect, Shape, Stage, Text, Transformer } from 'react-konva';
import { useEditorStore } from './editor.store';
import type { CanvasBackground, EditorObject, ImageObject, ShapeObject, SlotObject, TextObject } from './types';

const FIT_EVENT = 'frame-editor:fit';
export const requestFitZoom = () => window.dispatchEvent(new Event(FIT_EVENT));

const CHECKER_BG: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
};

export function getSafeImageSrc(src: string): string {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return src;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (src.includes('/photos/proxy-image')) return src;
    // Đi qua proxy backend để đảm bảo headers CORS (tránh lỗi Canvas bị Tainted khi export PNG)
    return `/api/v1/photos/proxy-image?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function useLoadedImage(rawSrc: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!rawSrc) {
      setImg(null);
      return;
    }
    const safeSrc = getSafeImageSrc(rawSrc);
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => {
      // Fallback: nếu proxy lỗi, thử lại trực tiếp rawSrc
      if (image.crossOrigin) {
        image.crossOrigin = null as any;
        image.src = rawSrc;
      }
    };
    image.src = safeSrc;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [rawSrc]);
  return img;
}

/** Vẽ các hình không phải chữ nhật vào hộp w×h */
function traceShape(ctx: Konva.Context, kind: ShapeObject['shape'], w: number, h: number) {
  ctx.beginPath();
  switch (kind) {
    case 'ellipse':
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2, false);
      break;
    case 'triangle':
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      break;
    case 'star': {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 1 : 0.42;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = w / 2 + Math.cos(a) * r * (w / 2);
        const py = h / 2 + Math.sin(a) * r * (h / 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      break;
    }
    case 'heart':
      ctx.moveTo(w * 0.5, h * 0.25);
      ctx.bezierCurveTo(w * 0.5, h * 0.12, w * 0.38, 0, w * 0.25, 0);
      ctx.bezierCurveTo(w * 0.08, 0, 0, h * 0.15, 0, h * 0.32);
      ctx.bezierCurveTo(0, h * 0.6, w * 0.35, h * 0.78, w * 0.5, h);
      ctx.bezierCurveTo(w * 0.65, h * 0.78, w, h * 0.6, w, h * 0.32);
      ctx.bezierCurveTo(w, h * 0.15, w * 0.92, 0, w * 0.75, 0);
      ctx.bezierCurveTo(w * 0.62, 0, w * 0.5, h * 0.12, w * 0.5, h * 0.25);
      break;
    default:
      ctx.rect(0, 0, w, h);
  }
  ctx.closePath();
}

const BackgroundImage: React.FC<{
  bg: Extract<CanvasBackground, { type: 'image' }>;
  width: number;
  height: number;
}> = ({ bg, width, height }) => {
  const image = useLoadedImage(bg.src);
  if (!image) {
    return <Rect name="bg" width={width} height={height} fill="#ffffff" />;
  }

  const fit = bg.fit || 'cover';
  const imgW = image.naturalWidth || image.width || width;
  const imgH = image.naturalHeight || image.height || height;

  let drawX = 0;
  let drawY = 0;
  let drawW = width;
  let drawH = height;

  if (fit === 'cover') {
    const scale = Math.max(width / imgW, height / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  } else if (fit === 'contain') {
    const scale = Math.min(width / imgW, height / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = (width - drawW) / 2;
    drawY = (height - drawH) / 2;
  }

  return (
    <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height} listening={false}>
      <KonvaImage
        name="bg"
        image={image}
        x={drawX}
        y={drawY}
        width={drawW}
        height={drawH}
        opacity={bg.opacity ?? 1}
        listening={false}
      />
    </Group>
  );
};

const Background: React.FC<{ bg: CanvasBackground; width: number; height: number }> = ({ bg, width, height }) => {
  if (bg.type === 'transparent') {
    return <Rect name="bg" width={width} height={height} fill="rgba(0,0,0,0)" />;
  }
  if (bg.type === 'solid') {
    return <Rect name="bg" width={width} height={height} fill={bg.color} />;
  }
  if (bg.type === 'gradient') {
    const a = (bg.angle * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
    const cx = width / 2;
    const cy = height / 2;
    return (
      <Rect
        name="bg"
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: cx - dx * half, y: cy - dy * half }}
        fillLinearGradientEndPoint={{ x: cx + dx * half, y: cy + dy * half }}
        fillLinearGradientColorStops={[0, bg.from, 1, bg.to]}
      />
    );
  }
  if (bg.type === 'image') {
    return <BackgroundImage bg={bg} width={width} height={height} />;
  }
  return null;
};


interface NodeProps<T extends EditorObject> {
  obj: T;
  exporting: boolean;
  interactive: Record<string, unknown>;
}

const SlotNode: React.FC<NodeProps<SlotObject> & { index: number }> = ({ obj, exporting, interactive, index }) => {
  const radius = obj.cornerRadius ?? 0;
  const strokeWidth = obj.strokeWidth ?? 0;
  const hasStroke = !!obj.stroke && strokeWidth > 0;
  const doc = useEditorStore((s) => s.doc);
  const customerPreview = useEditorStore((s) => s.customerPreview);

  // Tìm xem có idol/hình ảnh nào gắn với slot này không
  const idolInSlot = doc.objects.find(
    (o) => o.type === 'image' && (o as ImageObject).slotId === obj.id
  ) as ImageObject | undefined;

  if (exporting) {
    // Đục lỗ trong suốt tại vị trí slot (bo góc theo cornerRadius) và vẽ viền (nếu có)
    return (
      <Group listening={false}>
        <Rect
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          cornerRadius={radius}
          fill="#000000"
          globalCompositeOperation="destination-out"
        />
        {hasStroke && (
          <Rect
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            cornerRadius={radius}
            stroke={obj.stroke}
            strokeWidth={strokeWidth}
            globalCompositeOperation="source-over"
          />
        )}
      </Group>
    );
  }

  const label = String(index + 1);
  const fontSize = Math.max(14, Math.min(obj.width, obj.height) * 0.28);

  // Tính vị trí khách hàng đứng chụp khi bật chế độ xem trước
  let custX = 0;
  let custW = obj.width;
  if (idolInSlot) {
    if (idolInSlot.positionInSlot === 'right' || (!idolInSlot.positionInSlot && idolInSlot.x > obj.x)) {
      // Idol đứng bên phải -> Khách đứng bên trái
      custX = 0;
      custW = Math.max(10, idolInSlot.x - obj.x);
    } else {
      // Idol đứng bên trái -> Khách đứng bên phải
      custX = idolInSlot.width;
      custW = Math.max(10, obj.width - idolInSlot.width);
    }
  }

  return (
    <Group id={obj.id} x={obj.x} y={obj.y} opacity={obj.opacity} {...interactive}>
      {/* Background guide placeholder */}
      <Rect
        width={obj.width}
        height={obj.height}
        cornerRadius={radius}
        fill={idolInSlot ? "rgba(240, 253, 250, 0.4)" : "rgba(8,151,156,0.15)"}
        stroke="#08979c"
        strokeWidth={1.5}
        dash={[8, 4]}
        strokeScaleEnabled={false}
      />
      {/* Real border stroke if configured */}
      {hasStroke && (
        <Rect
          width={obj.width}
          height={obj.height}
          cornerRadius={radius}
          stroke={obj.stroke}
          strokeWidth={strokeWidth}
          strokeScaleEnabled={false}
          listening={false}
        />
      )}

      {/* Hiển thị số thứ tự ô ảnh */}
      {!customerPreview && (
        <>
          <Text
            width={obj.width}
            height={obj.height}
            text={label}
            align="center"
            verticalAlign="middle"
            fontSize={fontSize}
            fontStyle="bold"
            fill={idolInSlot ? "rgba(6,122,126,0.3)" : "#067a7e"}
            listening={false}
          />
          <Text
            y={obj.height - 24}
            width={obj.width}
            text={`${Math.round(obj.width)}×${Math.round(obj.height)}`}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fill="rgba(6,122,126,0.6)"
            listening={false}
          />
        </>
      )}

      {/* Chế độ xem trước chụp ảnh cùng Idol (Customer Preview) */}
      {customerPreview && (
        <Group x={custX} y={0} listening={false}>
          <Rect
            width={custW}
            height={obj.height}
            cornerRadius={radius}
            fill="rgba(255, 230, 240, 0.55)"
            stroke="#d81e69"
            strokeWidth={1.5}
            dash={[4, 4]}
          />
          <Text
            y={obj.height * 0.35}
            width={custW}
            text="👤📸"
            align="center"
            fontSize={20}
          />
          <Text
            y={obj.height * 0.35 + 28}
            width={custW}
            text="Khách chụp ở đây"
            align="center"
            fontSize={10}
            fontStyle="bold"
            fill="#d81e69"
          />
        </Group>
      )}
    </Group>
  );
};


const ShapeNode: React.FC<NodeProps<ShapeObject>> = ({ obj, interactive }) => {
  const common = {
    id: obj.id,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    rotation: obj.rotation,
    opacity: obj.opacity,
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    strokeEnabled: obj.strokeWidth > 0,
    shadowColor: obj.shadowColor,
    shadowBlur: obj.shadowBlur,
    shadowEnabled: obj.shadowBlur > 0,
    ...interactive,
  };
  if (obj.shape === 'rect') return <Rect {...common} cornerRadius={obj.cornerRadius} />;
  return (
    <Shape
      {...common}
      sceneFunc={(ctx, shape) => {
        traceShape(ctx, obj.shape, shape.width(), shape.height());
        ctx.fillStrokeShape(shape);
      }}
    />
  );
};

const TextNode: React.FC<NodeProps<TextObject>> = ({ obj, interactive }) => (
  <Text
    id={obj.id}
    x={obj.x}
    y={obj.y}
    width={obj.width}
    rotation={obj.rotation}
    opacity={obj.opacity}
    text={obj.text}
    fontFamily={obj.fontFamily}
    fontSize={obj.fontSize}
    fontStyle={obj.fontStyle}
    fill={obj.fill}
    align={obj.align}
    stroke={obj.stroke}
    strokeWidth={obj.strokeWidth}
    strokeEnabled={obj.strokeWidth > 0}
    fillAfterStrokeEnabled
    shadowColor={obj.shadowColor}
    shadowBlur={obj.shadowBlur}
    shadowEnabled={obj.shadowBlur > 0}
    {...interactive}
  />
);

const ImageNode: React.FC<NodeProps<ImageObject>> = ({ obj, interactive }) => {
  const image = useLoadedImage(obj.src);
  const doc = useEditorStore((s) => s.doc);
  if (!image) return null;

  const flipX = obj.flipX ? -1 : 1;
  const flipY = obj.flipY ? -1 : 1;

  // Nếu ảnh idol được gắn với một slot cụ thể và có clipToSlot
  const slot = obj.slotId
    ? (doc.objects.find((o) => o.id === obj.slotId && o.type === 'slot') as SlotObject | undefined)
    : undefined;

  const konvaImg = (
    <KonvaImage
      id={obj.id}
      image={image}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      opacity={obj.opacity}
      scaleX={flipX}
      scaleY={flipY}
      offsetX={obj.flipX ? obj.width : 0}
      offsetY={obj.flipY ? obj.height : 0}
      {...interactive}
    />
  );

  // Nếu gắn với slot và có clipToSlot: cắt phẳng chân và bo góc theo slot
  if (slot && obj.clipToSlot) {
    const r = slot.cornerRadius || 0;
    return (
      <Group
        clipFunc={(ctx) => {
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(slot.x, slot.y, slot.width, slot.height, r);
          } else if (r > 0) {
            const rad = Math.min(r, slot.width / 2, slot.height / 2);
            ctx.moveTo(slot.x + rad, slot.y);
            ctx.arcTo(slot.x + slot.width, slot.y, slot.x + slot.width, slot.y + slot.height, rad);
            ctx.arcTo(slot.x + slot.width, slot.y + slot.height, slot.x, slot.y + slot.height, rad);
            ctx.arcTo(slot.x, slot.y + slot.height, slot.x, slot.y, rad);
            ctx.arcTo(slot.x, slot.y, slot.x + slot.width, slot.y, rad);
          } else {
            ctx.rect(slot.x, slot.y, slot.width, slot.height);
          }
          ctx.closePath();
        }}
      >
        {konvaImg}
      </Group>
    );
  }

  return konvaImg;
};



interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

const EditorCanvas: React.FC<Props> = ({ stageRef }) => {
  const doc = useEditorStore((s) => s.doc);
  const selection = useEditorStore((s) => s.selection);
  const zoom = useEditorStore((s) => s.zoom);
  const exporting = useEditorStore((s) => s.exporting);
  const setSelection = useEditorStore((s) => s.setSelection);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const updateObjects = useEditorStore((s) => s.updateObjects);
  const updateMany = useEditorStore((s) => s.updateMany);
  const setZoom = useEditorStore((s) => s.setZoom);
  const attachIdolToSlot = useEditorStore((s) => s.attachIdolToSlot);
  const addImage = useEditorStore((s) => s.addImage);

  const containerRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const dragStart = useRef<Record<string, { x: number; y: number }>>({});

  const { width: cw, height: ch, background } = doc.canvas;

  // ---- Fit / zoom ----
  const fit = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width: W, height: H } = useEditorStore.getState().doc.canvas;
    const z = Math.min((el.clientWidth - 96) / W, (el.clientHeight - 96) / H, 1);
    setZoom(Math.max(0.05, z));
  }, [setZoom]);

  useEffect(() => {
    fit();
  }, [cw, ch, fit]);

  useEffect(() => {
    window.addEventListener(FIT_EVENT, fit);
    return () => window.removeEventListener(FIT_EVENT, fit);
  }, [fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const z = useEditorStore.getState().zoom;
      setZoom(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoom]);

  // Redraw loop for animated GIFs if present
  useEffect(() => {
    const hasGif = doc.objects.some(
      (o) => o.type === 'image' && (o.isGif || o.src.includes('.gif') || o.src.includes('data:image/gif'))
    );
    if (!hasGif) return;
    const stage = stageRef.current;
    if (!stage) return;
    const layer = stage.getLayers()[0];
    if (!layer) return;
    const anim = new Konva.Animation(() => {
      // redrawing the layer causes browser to render the active GIF frame
    }, layer);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [doc.objects, stageRef]);

  // ---- Gắn Transformer vào các node đang chọn ----
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selection
      .map((id) => stage.findOne(`#${id}`))
      .filter((n): n is Konva.Node => !!n && !doc.objects.find((o) => o.id === n.id())?.locked);
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selection, doc.objects, exporting, stageRef]);

  const byId = (id: string) => doc.objects.find((o) => o.id === id);
  const selectedObjs = selection.map(byId).filter((o): o is EditorObject => !!o);
  const hasSlotSelected = selectedObjs.some((o) => o.type === 'slot');
  const singleText = selectedObjs.length === 1 && selectedObjs[0].type === 'text';

  // ---- Event handlers cho từng node ----
  const handleSelect = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const additive = 'shiftKey' in e.evt && e.evt.shiftKey;
    if (additive) toggleSelection(id);
    else if (!selection.includes(id)) setSelection([id]);
  };

  const handleDragStart = (id: string) => {
    const stage = stageRef.current;
    if (!stage) return;
    const ids = selection.includes(id) ? selection : [id];
    dragStart.current = {};
    ids.forEach((sid) => {
      const n = stage.findOne(`#${sid}`);
      if (n) dragStart.current[sid] = { x: n.x(), y: n.y() };
    });
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    const start = dragStart.current[id];
    if (!stage || !start) return;
    const dx = e.target.x() - start.x;
    const dy = e.target.y() - start.y;
    Object.entries(dragStart.current).forEach(([sid, p]) => {
      if (sid === id) return;
      const n = stage.findOne(`#${sid}`);
      if (n && !byId(sid)?.locked) n.position({ x: p.x + dx, y: p.y + dy });
    });
  };

  const handleDragEnd = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const patches: Record<string, Partial<EditorObject>> = {};
    Object.keys(dragStart.current).forEach((sid) => {
      const n = stage.findOne(`#${sid}`);
      if (n && !byId(sid)?.locked) patches[sid] = { x: Math.round(n.x()), y: Math.round(n.y()) };
    });
    dragStart.current = {};
    if (Object.keys(patches).length) updateMany(patches);
  };

  const handleTransformEnd = (obj: EditorObject, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const sx = Math.abs(node.scaleX());
    const sy = Math.abs(node.scaleY());
    const isImage = obj.type === 'image';
    node.scaleX(isImage && obj.flipX ? -1 : 1);
    node.scaleY(isImage && obj.flipY ? -1 : 1);
    const patch: Partial<EditorObject> = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      rotation: obj.type === 'slot' ? 0 : Math.round(node.rotation() * 10) / 10,
      width: Math.max(10, Math.round(obj.width * sx)),
    };
    if (obj.type !== 'text') patch.height = Math.max(10, Math.round(obj.height * sy));
    updateObjects([obj.id], patch, 'transform');
  };


  const interactiveFor = (obj: EditorObject): Record<string, unknown> => {
    if (exporting) return { listening: false };
    return {
      draggable: !obj.locked,
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e),
      onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => handleSelect(obj.id, e),
      onDragStart: () => handleDragStart(obj.id),
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handleDragMove(obj.id, e),
      onDragEnd: handleDragEnd,
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(obj, e),
    };
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.container().getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;

    // 1. Kiểm tra kéo từ Kho ảnh trong Sidebar
    const rawAsset = e.dataTransfer.getData('application/photobooth-asset');
    if (rawAsset) {
      try {
        const asset = JSON.parse(rawAsset);
        const slots = doc.objects.filter((o): o is SlotObject => o.type === 'slot');
        const hitSlot = slots.find(
          (s) => canvasX >= s.x && canvasX <= s.x + s.width && canvasY >= s.y && canvasY <= s.y + s.height
        );

        if (hitSlot) {
          // Thả vào ô ảnh: tự động ghép idol vào slot
          const isLeft = canvasX < hitSlot.x + hitSlot.width / 2;
          const pos = isLeft ? 'left' : 'right';
          attachIdolToSlot(hitSlot.id, asset.src, pos, asset.width, asset.height);
          const slotIdx = slots.findIndex((s) => s.id === hitSlot.id);
          message.success(`Đã kéo ghép "${asset.name}" vào Ô #${slotIdx + 1} (${isLeft ? 'Bên Trái' : 'Bên Phải'})!`);
        } else {
          // Thả vào vùng tự do trên frame: thêm thành sticker/ảnh tại vị trí thả
          const maxDim = 260;
          let w = asset.width || 200;
          let h = asset.height || 200;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const posX = Math.round(canvasX - w / 2);
          const posY = Math.round(canvasY - h / 2);
          addImage(asset.src, w, h, posX, posY, asset.name);
          message.success(`Đã kéo "${asset.name}" vào vị trí trên frame!`);
        }
      } catch (err) {
        console.error('Lỗi drop asset:', err);
      }
      return;
    }

    // 2. Kiểm tra kéo thả file ảnh trực tiếp từ Desktop / Windows Explorer vào Canvas
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const src = String(re.target?.result);
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 300;
            let w = img.naturalWidth || 200;
            let h = img.naturalHeight || 200;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const slots = doc.objects.filter((o): o is SlotObject => o.type === 'slot');
            const hitSlot = slots.find(
              (s) => canvasX >= s.x && canvasX <= s.x + s.width && canvasY >= s.y && canvasY <= s.y + s.height
            );
            if (hitSlot) {
              const isLeft = canvasX < hitSlot.x + hitSlot.width / 2;
              attachIdolToSlot(hitSlot.id, src, isLeft ? 'left' : 'right', w, h);
              message.success(`Đã ghép ảnh thả vào Ô ảnh!`);
            } else {
              addImage(src, w, h, Math.round(canvasX - w / 2), Math.round(canvasY - h / 2), file.name);
              message.success(`Đã thêm ảnh thả vào frame!`);
            }
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  let slotIndex = -1;

  return (
    <div
      ref={containerRef}
      className="flex-1 min-w-0 overflow-auto bg-[#e5e7eb] flex"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSelection([]);
      }}
    >
      <div
        className="m-auto p-12 shrink-0"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setSelection([]);
        }}
      >
        <div
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          style={{
            width: cw * zoom,
            height: ch * zoom,
            boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
            ...(background.type === 'transparent' || exporting ? CHECKER_BG : { backgroundColor: '#fff' }),
          }}
        >
          <Stage
            ref={stageRef}
            width={cw * zoom}
            height={ch * zoom}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelection([]);
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelection([]);
            }}
          >
            <Layer>
              <Background bg={background} width={cw} height={ch} />
              {(exporting
                ? [
                    ...doc.objects.filter((o) => o.type === 'slot'),
                    ...doc.objects.filter((o) => o.type !== 'slot'),
                  ]
                : doc.objects
              ).map((obj) => {
                if (obj.visible === false) return null;
                const interactive = interactiveFor(obj);
                switch (obj.type) {
                  case 'slot':
                    slotIndex += 1;
                    return (
                      <SlotNode key={obj.id} obj={obj} exporting={exporting} interactive={interactive} index={slotIndex} />
                    );
                  case 'shape':
                    return <ShapeNode key={obj.id} obj={obj} exporting={exporting} interactive={interactive} />;
                  case 'text':
                    return <TextNode key={obj.id} obj={obj} exporting={exporting} interactive={interactive} />;
                  case 'image':
                    return <ImageNode key={obj.id} obj={obj} exporting={exporting} interactive={interactive} />;
                }
              })}

              {!exporting && (
                <Transformer
                  ref={trRef}
                  rotateEnabled={!hasSlotSelected}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  enabledAnchors={
                    singleText
                      ? ['middle-left', 'middle-right']
                      : [
                          'top-left',
                          'top-center',
                          'top-right',
                          'middle-left',
                          'middle-right',
                          'bottom-left',
                          'bottom-center',
                          'bottom-right',
                        ]
                  }
                  anchorSize={10}
                  anchorCornerRadius={5}
                  borderStroke="#d81e69"
                  anchorStroke="#d81e69"
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
