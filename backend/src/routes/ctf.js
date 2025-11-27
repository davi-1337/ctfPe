const express = require('express');
const router = express.Router();
const { SQL } = require('sql-template-strings');
const { db } = require('../db/init');
const requireJsonContent = require('../middlewares/jsonm');
const { verifyToken } = require('../middlewares/auth');

// Helper for async DB
const dbGet = (query) => new Promise((resolve, reject) => {
    db.get(query.sql, query.values, (err, row) => {
        if (err) reject(err); else resolve(row);
    });
});

const dbRun = (query) => new Promise((resolve, reject) => {
    db.run(query.sql, query.values, function(err) {
        if (err) reject(err); else resolve(this);
    });
});

const dbAll = (query) => new Promise((resolve, reject) => {
    db.all(query.sql, query.values, (err, rows) => {
        if (err) reject(err); else resolve(rows);
    });
});

/* ==========================================================================
   ANNOUNCEMENTS (Public)
   ========================================================================== */

router.get('/announcements', async (req, res) => {
    try {
        const announcements = await dbAll(SQL`SELECT * FROM announcements ORDER BY post_time DESC`);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ==========================================================================
   LEADERBOARD (Public)
   ========================================================================== */

router.get('/leaderboard', async (req, res) => {
    try {
        // Simplified leaderboard calculation on the fly
        const leaderboard = await dbAll(SQL`
            SELECT t.id, t.team_name, t.points 
            FROM teams t 
            ORDER BY t.points DESC
        `);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ==========================================================================
   AUTHENTICATED ROUTES (User Context)
   ========================================================================== */

router.use(verifyToken);
router.use(requireJsonContent); // Apply JSON requirement for POSTs below

/* ==========================================================================
   TEAMS
   ========================================================================== */

// GET /ctf/team/me - Check my team status
router.get('/team/me', async (req, res) => {
    try {
        const userId = req.user.id;
        const membership = await dbGet(SQL`SELECT team_id FROM team_members WHERE user_id = ${userId}`);
        
        if (!membership) {
            return res.json({ has_team: false });
        }

        const team = await dbGet(SQL`SELECT * FROM teams WHERE id = ${membership.team_id}`);
        res.json({ has_team: true, team });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /ctf/team/create - Create a new team
router.post('/team/create', async (req, res) => {
    const { team_name } = req.body;
    const userId = req.user.id;

    if (!team_name) return res.status(400).json({ error: 'Team name required' });

    try {
        // 1. Check if user already has a team
        const existingMember = await dbGet(SQL`SELECT id FROM team_members WHERE user_id = ${userId}`);
        if (existingMember) {
            return res.status(400).json({ error: 'You are already in a team.' });
        }

        // 2. Create Team
        const result = await dbRun(SQL`INSERT INTO teams (team_name) VALUES (${team_name})`);
        const newTeamId = result.lastID;

        // 3. Add user to team members
        await dbRun(SQL`INSERT INTO team_members (team_id, user_id) VALUES (${newTeamId}, ${userId})`);

        res.status(201).json({ message: 'Team created successfully', team_id: newTeamId });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Team name already taken' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /ctf/team/join - Join existing team
router.post('/team/join', async (req, res) => {
    const { team_name } = req.body;
    const userId = req.user.id;

    if (!team_name) return res.status(400).json({ error: 'Team name required' });

    try {
        const existingMember = await dbGet(SQL`SELECT id FROM team_members WHERE user_id = ${userId}`);
        if (existingMember) {
            return res.status(400).json({ error: 'You are already in a team.' });
        }

        const team = await dbGet(SQL`SELECT id FROM teams WHERE team_name = ${team_name}`);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        await dbRun(SQL`INSERT INTO team_members (team_id, user_id) VALUES (${team.id}, ${userId})`);
        res.json({ message: `Joined team ${team_name}` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ==========================================================================
   CHALLENGES & FLAG SUBMISSION
   ========================================================================== */

// GET /ctf/challenges - List challenges (hide flag)
router.get('/challenges', async (req, res) => {
    try {
        const challenges = await dbAll(SQL`
            SELECT id, name, description, category, points, first_blood_user, url, remoteUrl
            FROM challenges
        `);
        
        const userId = req.user.id;
        const solves = await dbAll(SQL`SELECT challenge_id FROM solves WHERE user_id = ${userId}`);
        const solvedIds = solves.map(s => s.challenge_id);

        const challengesWithStatus = challenges.map(c => ({
            ...c,
            solved: solvedIds.includes(c.id)
        }));

        res.json(challengesWithStatus);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});



router.get('/settings', async (req, res) => {
    try {
        const settings = await dbGet(SQL`SELECT ctf_name, ctf_start, ctf_end FROM settings ORDER BY id DESC LIMIT 1`);
        
        if (!settings) {
            return res.json({ 
                ctf_name: 'CTF Not Configured', 
                ctf_start: null, 
                ctf_end: null 
            });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /ctf/challenges/filter/:categoryId - List challenges by category ID
router.get('/challenges/filter/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        // 1. Verify category exists (Optional, but good for UX)
        // const category = await dbGet(SQL`SELECT id FROM category WHERE id = ${categoryId}`);
        // if (!category) return res.status(404).json({ error: 'Category not found' });

        // 2. Get Challenges for this category
        const challenges = await dbAll(SQL`
            SELECT id, name, description, category, points, first_blood_user, url, remoteUrl
            FROM challenges
            WHERE category = ${categoryId}
        `);
        
        // 3. Calculate Solved Status (Same logic as main list)
        const userId = req.user.id;
        const solves = await dbAll(SQL`SELECT challenge_id FROM solves WHERE user_id = ${userId}`);
        const solvedIds = solves.map(s => s.challenge_id);

        const challengesWithStatus = challenges.map(c => ({
            ...c,
            solved: solvedIds.includes(c.id)
        }));

        res.json(challengesWithStatus);

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /ctf/categories - List all available categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await dbAll(SQL`SELECT * FROM category`);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /ctf/submit - Submit flag
router.post('/submit', async (req, res) => {
    const { challenge_id, flag } = req.body;
    const userId = req.user.id;

    if (!challenge_id || !flag) {
        return res.status(400).json({ error: 'Challenge ID and flag required' });
    }

    try {
        // 1. VERIFY TEAM MEMBERSHIP (New Requirement)
        const membership = await dbGet(SQL`SELECT team_id FROM team_members WHERE user_id = ${userId}`);
        
        if (!membership) {
            return res.status(403).json({ 
                error: 'Team required', 
                message: 'You must join or create a team before submitting flags.' 
            });
        }

        // 2. Get Challenge
        const challenge = await dbGet(SQL`SELECT * FROM challenges WHERE id = ${challenge_id}`);
        if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

        // 3. Check if already solved by user OR TEAM?
        // Usually in CTFs, if one team member solves, the team solves.
        // Let's check if ANYONE in the team solved it to prevent duplicate points for the team.
        const teamSolved = await dbGet(SQL`
            SELECT s.id FROM solves s
            JOIN team_members tm ON s.user_id = tm.user_id
            WHERE tm.team_id = ${membership.team_id} AND s.challenge_id = ${challenge_id}
        `);

        if (teamSolved) {
            return res.status(400).json({ error: 'Your team already solved this challenge.' });
        }

        // 4. Verify Flag
        if (challenge.flag !== flag.trim()) {
            return res.status(400).json({ error: 'Incorrect flag' });
        }

        // 5. Correct Flag! Process Solve
        const points = parseInt(challenge.points);
        let message = 'Correct flag!';
        let isFirstBlood = false;

        // First Blood Logic
        if (!challenge.first_blood_user) {
            isFirstBlood = true;
            message += ' FIRST BLOOD!';
            await dbRun(SQL`UPDATE challenges SET first_blood_user = ${userId} WHERE id = ${challenge_id}`);
        }

        // Record Solve
        await dbRun(SQL`INSERT INTO solves (user_id, challenge_id) VALUES (${userId}, ${challenge_id})`);

        // Update Team Points
        await dbRun(SQL`UPDATE teams SET points = points + ${points} WHERE id = ${membership.team_id}`);

        res.json({ success: true, message, points, first_blood: isFirstBlood });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
