require('dotenv').config();
const MODE = process.env.MODE;
const REDIS_ENV = {
    HOST: process.env.REDIS_HOST,
    PORT: process.env.REDIS_PORT,
    NS: process.env.REDIS_NS,
}

const setTimeMillis = () => {
    return new Date().getTime() + (3600 * 9 * 1000);
}

const MYSQL_ENV = {
    HOST: process.env.MYSQL_HOST,
    USER: process.env.MYSQL_USER,
    PORT: process.env.MYSQL_PORT,
    DB: process.env.MYSQL_DB,
} 

module.exports = {
    MODE, 
    REDIS_ENV, 
    MYSQL_ENV, 
}