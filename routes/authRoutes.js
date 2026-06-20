const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')
const {signupUser, loginUser, profile} = require('../controller/authController')
router.post('/signup', signupUser)
router.post('/login', loginUser)
router.get("/profile", authMiddleware, profile)
module.exports = router;