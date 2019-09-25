const http = require('http')
const winston = require('winston')
const app = require('./app')
require('dotenv').config()
const database = require('./database/database')
const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const logger = winston.createLogger({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: './logs/weblog.log' })
    ]
})

database.connect()
.then(() => {
    server.on('error', (error) => {
        logger.log('error', error)
    })
    
    server.listen(PORT, HOST, () => {
        logger.log('info', `Server is starting at ${new Date()}`)
    })

    console.log(`Running on: ${HOST}:${PORT}`)
})

