import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    roomId: null,
    users: [],
    elements: [],
    redoStack: [],
    tool: 'pencil', // pencil, rectangle, circle, text
    color: '#ffffff',
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setRoom: (state, action) => {
            state.roomId = action.payload.roomId;
        },
        setUsers: (state, action) => {
            state.users = action.payload;
        },
        addUser: (state, action) => {
            if (!state.users.find((u) => u.userId === action.payload.userId)) {
                state.users.push(action.payload);
            }
        },
        setElements: (state, action) => {
            state.elements = action.payload;
        },
        addElement: (state, action) => {
            state.elements.push(action.payload);
        },
        updateOrAddElement: (state, action) => {
            const incoming = action.payload;
            const index = state.elements.findIndex(el => el.id === incoming.id);

            if (index !== -1) {
                const existing = state.elements[index];
                // Implement Simple Operational Transformation (OT)
                // Instead of destructive overwrite, we dynamically merge field diffs
                let merged = { ...existing };
                for (const key in incoming) {
                    if (incoming[key] !== existing[key]) {
                        if (key === 'points' && incoming.points && existing.points) {
                            // Prevent point truncation if another delayed socket overrides pencil logic
                            merged.points = incoming.points.length > existing.points.length ? incoming.points : existing.points;
                        } else {
                            // Apply atomic property overwrites for concurrent parameter dragging
                            merged[key] = incoming[key];
                        }
                    }
                }
                state.elements[index] = merged;
            } else {
                state.elements.push(incoming);
            }
        },
        removeElement: (state, action) => {
            state.elements = state.elements.filter(el => el.id !== action.payload);
        },
        pushToRedoStack: (state, action) => {
            state.redoStack.push(action.payload);
        },
        popFromRedoStack: (state) => {
            state.redoStack.pop();
        },
        clearRedoStack: (state) => {
            state.redoStack = [];
        },
        setTool: (state, action) => {
            state.tool = action.payload;
        },
        setColor: (state, action) => {
            state.color = action.payload;
        },
    },
});

export const {
    setRoom, setUsers, addUser, setElements, addElement,
    updateOrAddElement, removeElement, pushToRedoStack,
    popFromRedoStack, clearRedoStack, setTool, setColor
} = roomSlice.actions;
export default roomSlice.reducer;
