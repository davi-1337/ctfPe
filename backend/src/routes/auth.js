const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const { db } = require('../db/init');
// Import secureQuery from utils.js
const {secureQuery} =  require('../db/utils');
const {SQL} = require('sql-template-strings');
// Import JSON content middleware
const requireJsonContent = require('../middlewares/jsonm');
// Apply JSON content middleware to all routes in this router
router.use(requireJsonContent);
const DEBUG = process.env.DEBUGMODE === 'false';


/*
*   Authentication routes
*/
/*
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists or other database error.' });
            }
            res.status(201).json({ message: 'User registered successfully.' });
        });
    } catch (error) {
        if (debug === 'true') {
            console.error('Error during registration:', error);
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
});
*/ // insecure registration route commented out



/*

router.get('/login', (req, res) => {
  const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error during login.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully.', token });
    });
});

*/ // insecure login route commented out


// Secure routes:
/**
 * 
 * Route: POST /register old version
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(SQL`INSERT INTO users (username, password) VALUES (${username}, ${hashedPassword})`, function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists or other database error.' });
            }
            res.status(201).json({ message: 'User registered successfully.' });
        });
    } catch (error) {
        if (debug === 'true') {
            console.error('Error during registration:', error);
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
});
*/

router.post('/register', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ error: 'Missing request body.' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = SQL`INSERT INTO users (username, password_hash) VALUES (${username}, ${hashedPassword})`;

        db.run(query.sql, query.values, function (err) {
            if (err) {
                console.error("Erro no DB:", err.message); // Log para debug
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username already exists.' });
                }
                return res.status(500).json({ error: 'Database error.' });
            }
            res.status(201).json({ message: 'User registered successfully.' });
        });

    } catch (error) {
        console.error('Crash evitado:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * 
 * Route: POST /login
 * Description: Authenticates a user and returns a JWT token upon successful login.
 * 
 */

/*
router.get('/login', (req, res) => {
  const { username, password } = req.body;
    db.get(SQL`SELECT * FROM users WHERE username = ${username}`, async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error during login.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully.', token });
    });
});

*/

/*
router.post('/login', async (req, res) => {
    try {
        // 1. Validação de Formato
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request format.' });
        }

        const { username, password } = req.body;

        // 2. Validação de Campos
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // 3. Busca no Banco (CORREÇÃO PRINCIPAL AQUI)
        const query = SQL`SELECT * FROM users WHERE username = ${username}`;
        
        const user = await new Promise((resolve, reject) => {
            // IMPORTANTE: Passar query.sql e query.values separadamente
            db.get(query.sql, query.values, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // 4. Tratamento de Usuário não encontrado (Timing safe comparison seria ideal, mas mantendo simples)
        if (!user) {
            if (process.env.DEBUGMODE === 'true') console.warn(`[DEBUG] Login failed: User '${username}' not found.`);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const storedHash = user.password_hash || user.password; 

        if (!storedHash) {
            console.error(`[CRITICAL] User ${user.id} has no password hash in database.`);
            return res.status(500).json({ error: 'Internal authentication error.' });
        }

        // 5. Verificação de Senha
        const isMatch = await bcrypt.compare(password, storedHash);

        if (!isMatch) {
            if (process.env.DEBUGMODE === 'true') console.warn(`[DEBUG] Login failed: Incorrect password for '${username}'.`);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 6. Geração de Token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username 
            }, 
            process.env.JWT_SECRET || 'fallback_secret_CHANGE_THIS', 
            { expiresIn: '1h' }
        );

        if (process.env.DEBUGMODE === 'true') console.log(`[DEBUG] Login success: ${username} (ID: ${user.id})`);

        res.json({ 
            message: 'Logged in successfully.', 
            token,
            user: { id: user.id, username: user.username } 
        });

    } catch (error) {
        if (process.env.DEBUGMODE === 'true') {
            console.error('[DEBUG] Critical error in /login endpoint:', error);
            console.error(error.stack);
        } else {
            console.error('[ERROR] Internal login error.');
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
});
*/ // old login without admin

/**
 * Route: POST /login with admin support
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        let user = null;
        let role = 'user'; // Default role

        const userQuery = SQL`SELECT id, username, password_hash FROM users WHERE username = ${username}`;
        user = await new Promise((resolve, reject) => {
            db.get(userQuery.sql, userQuery.values, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            const adminQuery = SQL`SELECT id, username, password_hash FROM admin_users WHERE username = ${username}`;
            user = await new Promise((resolve, reject) => {
                db.get(adminQuery.sql, adminQuery.values, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (user) {
                role = 'admin'; // Se achou aqui, é admin!
                if (process.env.DEBUGMODE === 'true') console.log(`[DEBUG] Found admin user: ${username}`);
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const storedHash = user.password_hash;
        const isMatch = await bcrypt.compare(password, storedHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                role: role // 'user' ou 'admin'
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' } // admins??
        );

        res.json({ 
            message: 'Logged in successfully.', 
            token,
            role, 
            user: { id: user.id, username: user.username } 
        });

    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


module.exports = router; 