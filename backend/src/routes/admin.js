const express = require('express');
const router = express.Router();
const { SQL } = require('sql-template-strings');
const { db } = require('../db/init');
const requireJsonContent = require('../middlewares/jsonm');
const { verifyAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
/**
 * 
 * dumb solution i'll do the strangest thing ever :(
 * for the json middleware require 
 * sorry my english is soo bad
 */
router.use(verifyAdmin);

// Helper for async DB
const dbAll = (query) => {
    return new Promise((resolve, reject) => {
        db.all(query.sql, query.values, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
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

/**
 * GET /admin/users
 * List all registered users
 */
router.get('/users', async (req, res) => {
    try {
        const users = await dbAll(SQL`SELECT id, username, email FROM users`);
        res.json({ users });
    } catch (error) {
        console.error('[ADMIN] List Users Error:', error);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
});

/**
 * DELETE /admin/users/:id
 * Delete a user by ID
 */
router.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if user exists first
        const result = await dbRun(SQL`DELETE FROM users WHERE id = ${userId}`);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Also clean up solves/logs related to this user (Optional but recommended)
        await dbRun(SQL`DELETE FROM solves WHERE user_id = ${userId}`);
        
        res.json({ message: `User ${userId} deleted successfully.` });
    } catch (error) {
        console.error('[ADMIN] Delete User Error:', error);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

/**
 * GET /admin/stats
 * Basic CTF stats
 */
router.get('/stats', async (req, res) => {
    try {
        const userCount = await dbAll(SQL`SELECT count(*) as c FROM users`);
        const solveCount = await dbAll(SQL`SELECT count(*) as c FROM solves`);
        const challengeCount = await dbAll(SQL`SELECT count(*) as c FROM challenges`);

        res.json({
            total_users: userCount[0].c,
            total_solves: solveCount[0].c,
            total_challenges: challengeCount[0].c
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


// --- CATEGORIES ---

/**
 * POST /admin/categories
 * Create a new category
 */
// Note: requireJsonContent ONLY for JSON endpoints. Upload endpoints use multipart/form-data
router.post('/categories', requireJsonContent, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        await dbRun(SQL`INSERT INTO category (name) VALUES (${name})`);
        res.status(201).json({ message: `Category '${name}' created.` });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Category already exists.' });
        }
        console.error('[ADMIN] Create Category Error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

/**
 * GET /admin/categories
 * List all categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await dbAll(SQL`SELECT * FROM category`);
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// --- CHALLENGES ---

/**
 * POST /admin/challenges
 * Create a new challenge with file upload
 * Note: Do NOT use requireJsonContent here because this is multipart/form-data!
 */
router.post('/challenges', upload.single('file'), async (req, res) => {
    try {
        const { name, description, category, points, flag } = req.body;
        const file = req.file;

        if (!name || !description || !category || !points || !flag) {
            return res.status(400).json({ error: 'All fields (name, description, category, points, flag) are required.' });
        }

        const catExists = await dbGet(SQL`SELECT id FROM category WHERE name = ${category}`);
        if (!catExists) {
            return res.status(400).json({ error: `Category '${category}' does not exist. Create it first.` });
        }

        let fileUrl = null;
        if (file) {
            fileUrl = `/uploads/challenges/${file.filename}`;
        }

        // 4. Insert into DB
        await dbRun(SQL`
            INSERT INTO challenges (name, description, category, points, flag, url)
            VALUES (${name}, ${description}, ${category}, ${points}, ${flag}, ${fileUrl})
        `);

        res.status(201).json({ 
            message: 'Challenge created successfully.',
            file_uploaded: !!file
        });

    } catch (error) {
        console.error('[ADMIN] Create Challenge Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
