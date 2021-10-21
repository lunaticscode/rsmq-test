require('dotenv').config();
const MODEL = {
    TABLE: {
        LOG: process.env.MYSQL_LOG_TABLE,
    },
    COL: {
        LOG: {
            SID: "sid",
            PAGE: "page",
            ACT: "act",
            OS: "os",
            DATE: "date",
        }
    }
}
exports.MYSQL_MODEL = MODEL;