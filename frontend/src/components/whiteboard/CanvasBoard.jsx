import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stage, Layer, FastLayer, Line, Rect, Circle, Text } from 'react-konva';
import { setElements, addElement, clearRedoStack, removeElement } from '../../store/roomSlice';

// Helper to render any single element efficiently
const RenderElement = React.memo(({ el }) => {
    const strokeColor = el.tool === 'eraser' ? '#ffffff' : el.color; // matches white bg
    const strokeWidth = el.tool === 'eraser' ? 20 : 3;

    if (el.tool === 'pencil' || el.tool === 'eraser') {
        return (
            <Line
                points={el.points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={el.tool === 'eraser' ? 'destination-out' : 'source-over'}
            />
        );
    }
    if (el.tool === 'rectangle') {
        return (
            <Rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                stroke={el.color}
                strokeWidth={3}
            />
        );
    }
    if (el.tool === 'circle') {
        return (
            <Circle
                x={el.x}
                y={el.y}
                radius={el.radius}
                stroke={el.color}
                strokeWidth={3}
            />
        );
    }
    if (el.tool === 'text') {
        return (
            <Text
                x={el.x}
                y={el.y}
                text={el.text}
                fontSize={24}
                fill={el.color}
            />
        );
    }
    return null;
});

export default function CanvasBoard({ socket, roomId }) {
    const { elements, tool, color } = useSelector((state) => state.room);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [currentElement, setCurrentElement] = useState(null);
    const isDrawing = useRef(false);
    const lastEmitTime = useRef(0);

    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onCanvasState = (stateElements) => dispatch(setElements(stateElements));
        const onDrawStroke = (element) => dispatch({ type: 'room/updateOrAddElement', payload: element });
        const onUndoAction = (elementId) => dispatch(removeElement(elementId));

        socket.on('canvas-state', onCanvasState);
        socket.on('draw-stroke', onDrawStroke);
        socket.on('undo-action', onUndoAction);

        return () => {
            socket.off('canvas-state', onCanvasState);
            socket.off('draw-stroke', onDrawStroke);
            socket.off('undo-action', onUndoAction);
        };
    }, [socket, dispatch]);

    const handleMouseDown = useCallback((e) => {
        if (tool === 'pointer') return;
        dispatch(clearRedoStack());

        const pos = e.target.getStage().getPointerPosition();
        const newId = Date.now().toString() + Math.random().toString(36).substring(7);

        if (tool === 'text') {
            const textVal = window.prompt("Enter text:");
            if (textVal) {
                const textElement = {
                    id: newId, userId: user?.id, tool, color, x: pos.x, y: pos.y, text: textVal
                };
                dispatch(addElement(textElement));
                socket.emit('draw-stroke', { roomId, strokeData: textElement });
            }
            return;
        }

        isDrawing.current = true;
        const newElement = {
            id: newId, userId: user?.id, tool, color, points: [pos.x, pos.y], x: pos.x, y: pos.y, width: 0, height: 0, radius: 0,
        };
        setCurrentElement(newElement);

        socket.emit('draw-stroke', { roomId, strokeData: newElement });
        lastEmitTime.current = Date.now();

    }, [tool, color, roomId, socket, dispatch, user]);

    const handleMouseMove = useCallback((e) => {
        if (!isDrawing.current || !currentElement) return;

        const pos = e.target.getStage().getPointerPosition();
        let updatedElement = { ...currentElement };

        // Basic Viewport Virtualization equivalent mapping - updating coords naturally
        if (tool === 'pencil' || tool === 'eraser') {
            updatedElement.points = [...updatedElement.points, pos.x, pos.y];
        } else if (tool === 'rectangle') {
            updatedElement.width = pos.x - updatedElement.x;
            updatedElement.height = pos.y - updatedElement.y;
        } else if (tool === 'circle') {
            const dx = pos.x - updatedElement.x;
            const dy = pos.y - updatedElement.y;
            updatedElement.radius = Math.sqrt(dx * dx + dy * dy);
        }

        setCurrentElement(updatedElement);

        const now = Date.now();
        if (now - lastEmitTime.current >= 200) {
            socket.emit('draw-stroke', { roomId, strokeData: updatedElement });
            lastEmitTime.current = now;
        }
    }, [currentElement, tool, roomId, socket]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing.current || !currentElement) return;
        isDrawing.current = false;

        socket.emit('draw-stroke', { roomId, strokeData: currentElement });
        dispatch(addElement(currentElement));
        setCurrentElement(null);
    }, [currentElement, roomId, socket, dispatch]);

    // Standard Layer with listening=false replaces deprecated FastLayer
    const stableLayer = useMemo(() => {
        return (
            <Layer listening={false}>
                {elements.map((el) => {
                    return <RenderElement key={el.id} el={el} />;
                })}
            </Layer>
        );
    }, [elements]);

    return (
        <div className="w-full h-full bg-white overflow-hidden cursor-crosshair">
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                {stableLayer}
                {currentElement && (
                    <Layer>
                        <RenderElement el={currentElement} />
                    </Layer>
                )}
            </Stage>
        </div>
    );
}
