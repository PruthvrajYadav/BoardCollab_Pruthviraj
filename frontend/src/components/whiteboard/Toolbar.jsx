import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Pencil, Square, Circle, Type, Pointer, Eraser, Undo, Redo, Download, Sparkles } from 'lucide-react';
import { setTool, setColor, removeElement, pushToRedoStack, popFromRedoStack, addElement, toggleSmartMode } from '../../store/roomSlice';

const tools = [
    { id: 'pointer', icon: Pointer, label: 'Select' },
    { id: 'pencil', icon: Pencil, label: 'Draw' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const colors = ['#000000', '#ff3b30', '#4cd964', '#007aff', '#ffcc00', '#5856d6'];

export default function Toolbar({ socket, roomId }) {
    const { tool, color, elements, redoStack, isSmartMode } = useSelector((state) => state.room);
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleUndo = () => {
        const myElements = elements.filter(el => el.userId === user?.id);
        if (myElements.length === 0) return;
        const lastElement = myElements[myElements.length - 1];

        dispatch(removeElement(lastElement.id));
        dispatch(pushToRedoStack(lastElement));

        if (socket && roomId) {
            socket.emit('undo-action', { roomId, elementId: lastElement.id });
        }
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const elementToRedo = redoStack[redoStack.length - 1];

        dispatch(popFromRedoStack());
        dispatch(addElement(elementToRedo));

        if (socket && roomId) {
            socket.emit('draw-stroke', { roomId, strokeData: elementToRedo });
        }
    };

    const handleExport = async (format) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/rooms/${roomId}/export?format=${format}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                let url;
                if (format === 'svg') {
                    const text = await res.text();
                    const blob = new Blob([text], { type: 'image/svg+xml' });
                    url = window.URL.createObjectURL(blob);
                } else {
                    const blob = await res.blob();
                    url = window.URL.createObjectURL(blob);
                }

                const a = document.createElement('a');
                a.href = url;
                a.download = `boardcollab-${roomId}.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    return (
        <div className="flex flex-row md:flex-col bg-white rounded-xl border border-gray-200 shadow-xl p-2 md:p-2 w-auto max-w-[95vw] md:w-14 items-center overflow-x-auto no-scrollbar">


            <div className="flex flex-row md:flex-col space-x-1 md:space-x-0 md:space-y-1 flex-shrink-0">
                {tools.map((t) => {
                    const Icon = t.icon;
                    const isActive = tool === t.id;
                    return (
                        <button
                            key={t.id}
                            title={t.label}
                            onClick={() => dispatch(setTool(t.id))}
                            className={`p-2.5 md:p-2 rounded flex justify-center items-center transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <Icon className="w-5 h-5 md:w-5 md:h-5" />
                        </button>


                    );
                })}
            </div>

            <div className="w-px md:w-full h-8 md:h-px bg-gray-200 mx-2 md:mx-0 md:my-2"></div>

            <div className="flex flex-row md:flex-col items-center space-x-1 sm:space-x-2 md:space-x-0 md:space-y-2 flex-shrink-0">
                {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => dispatch(setColor(c))}
                        className={`w-6 h-6 md:w-6 md:h-6 rounded-full border-2 transition-transform ${color === c ? 'border-blue-500 scale-110 shadow-sm' : 'border-gray-200 hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                        title={`Color: ${c}`}
                    />

                ))}
            </div>

            <div className="w-px md:w-full h-8 md:h-px bg-gray-200 mx-2 md:mx-0 md:my-2"></div>

            <div className="flex flex-col items-center flex-shrink-0">
                <button
                    title="AI Smart Refine"
                    onClick={() => dispatch(toggleSmartMode())}
                    className={`p-2.5 md:p-2 rounded flex justify-center items-center transition-all ${isSmartMode ? 'bg-purple-100 text-purple-600 shadow-inner' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                    <Sparkles className={`w-5 h-5 md:w-5 md:h-5 ${isSmartMode ? 'animate-pulse' : ''}`} />
                </button>


            </div>

            <div className="w-px md:w-full h-8 md:h-px bg-gray-200 mx-2 md:mx-0 md:my-2"></div>

            <div className="flex flex-row md:flex-col space-x-1 md:space-x-0 md:space-y-1 items-center flex-shrink-0">
                <button title="Undo" onClick={handleUndo} className="p-1.5 md:p-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    <Undo className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button title="Redo" onClick={handleRedo} className="p-1.5 md:p-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    <Redo className="w-4 h-4 md:w-5 md:h-5" />
                </button>

            </div>

            <div className="w-px md:w-full h-8 md:h-px bg-gray-200 mx-2 md:mx-0 md:my-2"></div>

            <div className="flex flex-col items-center space-y-1 mt-1 group relative flex-shrink-0">
                <button className="p-1.5 md:p-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                </button>


                <div className="absolute right-0 md:left-full bottom-full md:top-0 mb-2 md:mb-0 md:ml-1 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto bg-white border border-gray-200 shadow-md rounded p-1">
                    <button onClick={() => handleExport('png')} className="px-3 py-1.5 hover:bg-gray-100 text-sm text-gray-700 font-medium rounded text-left whitespace-nowrap">
                        Export PNG
                    </button>
                    <button onClick={() => handleExport('svg')} className="px-3 py-1.5 hover:bg-gray-100 text-sm text-gray-700 font-medium rounded text-left whitespace-nowrap">
                        Export SVG
                    </button>
                </div>
            </div>
        </div>
    );
}
