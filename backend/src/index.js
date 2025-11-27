const express = require('express');
const app = express();
const authRoutes = require('./routes/auth'); 
const { initDb } = require('./db/init');
const setupRoutes = require('./routes/setup');
const adminRoutes = require('./routes/admin');

// init env variables from .env file
require('dotenv').config();

// Initialize the database
initDb().then(() => {
  console.log('Database initialization successfully.');
}).catch((err) => {
  console.error('Database initialization failed:', err);
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[CRITICAL] JWT_SECRET is not defined in .env');
    process.exit(1);
}

/*
*   Express app setup
*   Define middleware and routes here
*   Be sure to import route files as needed
*/

app.get('/hello', (req, res) => {
  res.send('CTFPE is alive!');
});

app.get('/', (req, res) => {
  res.send(':) Welcome to CTFPE!');
});

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Yep!! :)
 * Routes
 */

app.use('/setup', setupRoutes);
app.use('/auth', authRoutes); // /auth/{route} will be handled by auth
// admin routes

app.use('/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});