const admin = require('../firebaseAdmin');

/**
 * Middleware that verifies a Firebase ID token from the Authorization header.
 * 
 * Extracts and verifies the token using Firebase Admin SDK. If valid, attaches the decoded token
 * to `req.user` and proceeds to the next middleware. If invalid or missing, returns a 401 response.
 *
 * @async
 * @function verifyFirebaseToken
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const verifyFirebaseToken = async (req, res, next)  => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if(!token) return res.status(401).json({message: 'No token provided' });

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }   catch(error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyFirebaseToken;