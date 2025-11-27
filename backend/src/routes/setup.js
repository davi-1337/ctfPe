const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { SQL } = require('sql-template-strings');
const { db } = require('../db/init');
const requireJsonContent = require('../middlewares/jsonm');

router.use(requireJsonContent);

// Fuck the secureQuery and things like that let's use your own promises

const dbGet = (query) => {
    return new Promise((resolve, reject) => {
        db.get(query.sql, query.values, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbRun = (query) => {
    return new Promise((resolve, reject) => {
        db.run(query.sql, query.values, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

async function isSetupCompleted() {
    try {
        const result = await dbGet(SQL`SELECT count(*) as count FROM admin_users`);
        return result && result.count > 0;
    } catch (err) {
        console.error("Error checking setup status:", err);
        return false; 
    }
}

router.get('/status', async (req, res) => {
    try {
        const completed = await isSetupCompleted();
        res.json({ setup_completed: completed });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Old admin setup route commented out
/*
router.post('/', async (req, res) => {
    try {
        if (await isSetupCompleted()) {
            return res.status(403).json({ 
                error: 'Forbidden', 
                message: 'Setup already completed.' 
            });
        }

        const { username, password, ctf_name } = req.body;

        if (!username || !password || !ctf_name) {
            return res.status(400).json({ 
                error: 'Missing fields', 
                message: 'Username, password and ctf_name are required.' 
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password too short.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12); 

        await dbRun(SQL`
            INSERT INTO admin_users (username, password_hash) 
            VALUES (${username}, ${hashedPassword})
        `);

        console.log(`[SETUP] Admin '${username}' created.`);

        res.status(201).json({ 
            message: 'Setup completed.',
            admin: username
        });

    } catch (error) {
        console.error('[SETUP ERROR]', error);
        res.status(500).json({ error: 'Server error.' });
    }
});
*/

router.post('/', async (req, res) => {
    try {
        if (await isSetupCompleted()) {
            return res.status(403).json({ error: 'Forbidden', message: 'Setup already completed.' });
        }

        // duration_days is optional (defaults to 7)
        const { username, password, ctf_name, duration_days } = req.body;

        if (!username || !password || !ctf_name) {
            return res.status(400).json({ error: 'Missing fields', message: 'Username, password and ctf_name are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password too short.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12); 

        // Calculate End Date
        // Default: Start NOW, End NOW + X days (default 7)
        const days = duration_days ? parseInt(duration_days) : 7;
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + days);

        // Format for SQLite (YYYY-MM-DD HH:MM:SS)
        const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = end.toISOString().slice(0, 19).replace('T', ' ');

        // 1. Create Admin
        await dbRun(SQL`
            INSERT INTO admin_users (username, password_hash) 
            VALUES (${username}, ${hashedPassword})
        `);

        // 2. Save Settings with dynamic dates
        await dbRun(SQL`
            INSERT INTO settings (ctf_name, ctf_start, ctf_end)
            VALUES (${ctf_name}, ${startStr}, ${endStr})
        `);

        console.log(`[SETUP] Admin '${username}' created. CTF '${ctf_name}' duration: ${days} days.`);

        res.status(201).json({ 
            message: 'Setup completed.',
            admin: username,
            ctf_name: ctf_name,
            start: startStr,
            end: endStr
        });

    } catch (error) {
        console.error('[SETUP ERROR]', error);
        res.status(500).json({ error: 'Server error.' });
    }
});


module.exports = {
    router
};