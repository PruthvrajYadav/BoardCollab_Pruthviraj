const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Example protected route for testing
router.get('/me', protect, (req, res) => {
    res.status(200).json(req.user);
});

module.exports = router;
