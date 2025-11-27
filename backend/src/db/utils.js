/*
FUCK THESE utils.js we don't need that any more
*/

const {db} = require('../db/init');
const {initDb} = require('../db/init');
// Import sql-template-tag for safer SQL queries
const SQL = require('sql-template-strings')

async function insecureQuery(sql, params=[]) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function secureQuery(statement) {
    return new Promise(async (resolve, reject) => {
        try {   
            const initialized = await isDbInitialized();
            if (!initialized) {
                return reject(new Error('Database not initialized'));
            }

            if (!statement || !statement.text || !statement.values) {
                return reject(new Error('Invalid query object. Use SQL template string.'));
            }

            db.all(statement.text, statement.values, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    insecureQuery,
    secureQuery
};

