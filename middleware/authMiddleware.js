const jwt = require("jsonwebtoken")

const authMiddleware = (req,res,next) => {
    const authHeader = req.headers.authorization
    if(!authHeader) {
        return res.status(401).json({
            message: "No Authorization Header"
        })
    }
    if(!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Invalid Authorization format"
        })
    }
    const token = authHeader.split(" ")[1]
    if(!token) {
        return res.status(401).json({
            message: "token is not provided"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next();
    } catch(err) {
        return res.status(500).json({
            message : "Invalid or expired token"
        })
    }
    
}

module.exports = authMiddleware;