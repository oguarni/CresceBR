const jwt = require('jsonwebtoken');
const { User, Supplier } = require('..');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Supplier,
        required: false
      }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin required.' });
  }
  next();
};

const isSupplier = (req, res, next) => {
  if (req.user.role !== 'supplier') {
    return res.status(403).json({ error: 'Access denied. Supplier required.' });
  }
  next();
};

const isSupplierOrAdmin = (req, res, next) => {
  if (req.user.role !== 'supplier' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Supplier or Admin required.' });
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  isSupplier,
  isSupplierOrAdmin
};
