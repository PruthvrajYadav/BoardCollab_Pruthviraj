const Room = require('../models/Room');
const crypto = require('crypto');
const { createCanvas } = require('@napi-rs/canvas');

const createRoom = async (req, res) => {
    try {
        const roomId = crypto.randomBytes(4).toString('hex');
        const room = await Room.create({
            roomId,
            owner: req.user._id,
            users: [req.user._id],
        });
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const joinRoom = async (req, res) => {
    try {
        const roomId = req.params.roomId.trim();
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const userExists = room.users.some(id => id.toString() === req.user._id.toString());
        if (!userExists) {
            room.users.push(req.user._id);
            await room.save();
        }
        res.status(200).json(room);
    } catch (error) {
        console.error('Join Room Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const exportRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { format } = req.query;

        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (format === 'svg') {
            let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">\n`;
            svgStr += `<rect width="1920" height="1080" fill="#ffffff" />\n`;

            room.elements.forEach(el => {
                const stroke = el.tool === 'eraser' ? '#ffffff' : el.color;
                const width = el.tool === 'eraser' ? 20 : 3;

                if (el.tool === 'pencil' || el.tool === 'eraser') {
                    if (el.points && el.points.length >= 2) {
                        let d = `M ${el.points[0]} ${el.points[1]}`;
                        for (let i = 2; i < el.points.length; i += 2) d += ` L ${el.points[i]} ${el.points[i + 1]}`;
                        svgStr += `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`;
                    }
                } else if (el.tool === 'rectangle') {
                    svgStr += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" stroke="${stroke}" stroke-width="${width}" fill="none" />\n`;
                } else if (el.tool === 'circle') {
                    svgStr += `<circle cx="${el.x}" cy="${el.y}" r="${el.radius}" stroke="${stroke}" stroke-width="${width}" fill="none" />\n`;
                } else if (el.tool === 'text') {
                    svgStr += `<text x="${el.x}" y="${el.y}" fill="${el.color}" font-family="Arial" font-size="24">${el.text}</text>\n`;
                }
            });
            svgStr += `</svg>`;

            res.setHeader('Content-Type', 'image/svg+xml');
            return res.send(svgStr);
        }

        // PNG format using napi-rs canvas
        const canvas = createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1920, 1080);

        room.elements.forEach(el => {
            ctx.strokeStyle = el.tool === 'eraser' ? '#ffffff' : el.color;
            ctx.lineWidth = el.tool === 'eraser' ? 20 : 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = el.color;
            ctx.font = '24px Arial';

            if (el.tool === 'pencil' || el.tool === 'eraser') {
                if (!el.points || el.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(el.points[0], el.points[1]);
                for (let i = 2; i < el.points.length; i += 2) {
                    ctx.lineTo(el.points[i], el.points[i + 1]);
                }
                ctx.stroke();
            } else if (el.tool === 'rectangle') {
                ctx.strokeRect(el.x, el.y, el.width, el.height);
            } else if (el.tool === 'circle') {
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (el.tool === 'text') {
                ctx.fillText(el.text, el.x, el.y);
            }
        });

        const pngBuffer = await canvas.encode('png');
        res.setHeader('Content-Type', 'image/png');
        res.send(pngBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};

module.exports = {
    createRoom,
    joinRoom,
    exportRoom
};
