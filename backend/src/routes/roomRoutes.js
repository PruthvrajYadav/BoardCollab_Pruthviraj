const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, exportRoom } = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create', protect, createRoom);
router.post('/join/:roomId', protect, joinRoom);
router.get('/:roomId/export', protect, exportRoom);

module.exports = router;
