const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('.... :) Connected to the database.');
});
/*
db.serialize(() => {
  db.run('CREATE TABLE lorem (info TEXT)')
  const stmt = db.prepare('INSERT INTO lorem VALUES (?)')

  for (let i = 0; i < 10; i++) {
    stmt.run(`Ipsum ${i}`)
  }

  stmt.finalize()

  db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
    console.log(`${row.id}: ${row.info}`)
  })
})
*/ //example code commented out

async function initDb() {
    const initialized = await isDbInitialized();
    if (!initialized) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS category (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    password_hash TEXT
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    remoteUrl TEXT,  
    points TEXT,
    name TEXT,
    description TEXT,
    category TEXT,
    flag TEXT,
    first_blood_user INTEGER,
    FOREIGN KEY(category) REFERENCES category(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE solves (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    challenge_id INTEGER,
                    solve_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE hints (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_id INTEGER,
                    hint_text TEXT,
                    cost INTEGER,
                    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password_hash TEXT
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT,
                    log_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_name TEXT UNIQUE,
                    members TEXT,
                    points INTEGER DEFAULT 0
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE team_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER,
                    user_id INTEGER,
                    FOREIGN KEY(team_id) REFERENCES teams(id),
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE announcements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    content TEXT,
                    post_time DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ctf_name TEXT,
                    ctf_start DATETIME,
                    ctf_end DATETIME
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                db.run(`CREATE TABLE leaderboard (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team INTEGER,
                    points INTEGER,
                    last_solve_time DATETIME,
                    FOREIGN KEY(team) REFERENCES teams(id)
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
                );
            });
        });
    }


}


function isDbInitialized() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`, (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(!!row);
        });
    });
}


module.exports = {
    db,
    initDb,
    isDbInitialized
};