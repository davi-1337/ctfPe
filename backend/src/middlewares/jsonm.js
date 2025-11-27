const typeis = require('type-is');

const requireJsonContent = (req, res, next) => {
    // Skip validation for methods that don't have a body
    if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (!typeis(req, ['json'])) {
        return res.status(415).json({ 
            error: 'Unsupported Media Type',
            message: 'Server requires application/json header.'
        });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
            error: 'Bad Request', 
            message: 'Request body cannot be empty.' 
        });
    }

    next();
};

module.exports = requireJsonContent; 