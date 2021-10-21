const { MODE, REDIS_ENV, MYSQL_ENV } = require('./config');
const { MYSQL_MODEL } = require('./db_model');
const RedisSMQ = require('rsmq');
const mysql = require('mysql2');
const rsmq = new RedisSMQ({ host: REDIS_ENV.HOST, port: REDIS_ENV.PORT })
const IS_DEBUG = (MODE === "LOCAL" || "STAGE" );

const RSMQ_ERR_MSG = {
    QUEUE_NOT_FOUND: "queueNotFound",
}

const CUSTOM_ERR_MSG = {
    RSMQ_FAILED_CREATE: `${__filename} ::: (!)Failed to Create Queue`,
    RSMQ_FAILED_SEND: `${__filename} ::: (!)Failed to Send Message`,
    RSMQ_NOT_REGISTERED: `${__filename} ::: (!)This Queue, Not yet been registered`,
    RSMQ_FAILED_DELETE: `${__filename} ::: (!)Failed to Delete Message`,

    MYSQL_EXECUTE_INSERT_ERROR: `${__filename} ::: (!)Failed to Execute INSERT-SQL`,
}

const _createQueue = ( qname ) => {
    return new Promise(( resolve, reject ) => {
        rsmq.createQueue( { qname }, ( err, result ) => {
            if( err ){ 
                IS_DEBUG && conosle.log('_createQueue ::: err => \n', err);
                return reject(err);
            } 
            if( !err && Number( result ) === 1 ){
                return resolve(true);
            }
            return reject( new Error(CUSTOM_ERR_MSG.RSMQ_FAILED_CREATE) );
        })
    })
}

const _sendMessage = ( qname, message ) => {
    return new Promise(( resolve, reject ) => {
        rsmq.sendMessage( { qname, message }, ( err, result ) => {
            if( err ){
                IS_DEBUG && console.log('_sendMessage ::: err => \n', err);
                return reject(err);
            }
            if( !err && Number( result ) === 1 ){
                return resolve(true);
            }
            return reject(new Error(CUSTOM_ERR_MSG.RSMQ_FAILED_SEND) );
        })
    })
}

const sendProcess = ( qname, message ) => {
    return new Promise(( resolve, reject ) => {
        _sendMessage( qname, message ).then( async() => {
            return resolve(true)
        })
        .catch( async(e) => {
            try {
                if( e.name === RSMQ_ERR_MSG.QUEUE_NOT_FOUND ){
                    await _createQueue(qname);
                    await _sendMessage(qname, message)
                    return resolve(true)
                }
                return reject(e);
            }catch(err){
                return reject(err);
            }
        })
    })
}

const _receiveMessage = ( qname ) => {
    return new Promise( ( resolve, reject ) => {
        rsmq.receiveMessage( { qname }, ( err, result ) => {
            if( err && err.name === RSMQ_ERR_MSG.QUEUE_NOT_FOUND ){
                IS_DEBUG && console.log(CUSTOM_ERR_MSG.RSMQ_NOT_REGISTERED);
                return resolve(false);
            }
            if( err ){ return reject(err); }
            if( !err && result.id ){
                return resolve(result);
            } 
            return resolve(true)
        })
    })
}

const setTimeMillis = () => new Date().getTime() + (3600 * 9 * 1000);
const INSERT_MYSQL_SQL = `INSERT INTO '${MYSQL_MODEL.TABLE.LOG}' ('${MYSQL_MODEL.COL.LOG.SID}', '${MYSQL_MODEL.COL.LOG.PAGE}', '${MYSQL_MODEL.COL.LOG.ACT}', '${MYSQL_MODEL.COL.LOG.OS}', '${MYSQL_MODEL.COL.LOG.DATE}') VALUES (?, ?, ?, ?, ?);`;
const _saveLog = ( data ) => {
    return new Promise(( resolve, reject ) => {
        const connection = mysql.createConnection({
            host: MYSQL_ENV.HOST,
            port: MYSQL_ENV.PORT,
            user: MYSQL_ENV.USER,
            database: MYSQL_ENV.DB,
            waitForConnections: true,
            connectionLimit: 15,
        })
        const _sql = INSERT_MYSQL_SQL;
        const _values = JSON.parse(data.message);
        connection.execute( _sql, [ _values.sid, _values.page, _values.act, _values.os, setTimeMillis() ], (err) => {
            connection.end();
            if( err ){
                IS_DEBUG && console.log(CUSTOM_ERR_MSG.MYSQL_EXECUTE_INSERT_ERROR);
                return reject(err);
            }
            return resolve(data.id);
        })
    })
}

const _deleteMessage = (qname, id) => {
    return new Promise( (resolve, reject) => {
        rsmq.deleteMessage( { qname, id }, ( err ) => {
            if(err){
                IS_DEBUG && console.log(CUSTOM_ERR_MSG.RSMQ_FAILED_DELETE);
                return reject(err);
            }
            return resolve(true);
        })
    })
}

const receiveProcess = ( qname ) => {
    return new Promise(( resolve, reject ) => {
        _receiveMessage(qname).then( async( data ) => {
            try{
                if( typeof data !== "undefined" ){
                    const id = await _saveLog(data);
                    await _deleteMessage(qname, id);
                    return resolve(true);
                }   
                return resolve(false);
            }
            catch(err){
                return reject(err);
            }
        }).catch( (e) => {
            return reject(e)
        })
    })
}

exports.rsmqSendProcess = sendProcess;
exports.rsmqReceiveProcess = receiveProcess;