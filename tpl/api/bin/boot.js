let { EOL } = require('os')
let conf = require('dotenv').load()
/* eslint-disable */
console.log(EOL + '============CONFIG============')
for (let k in process.env) {
  console.log(`${k}\t${process.env[k]}`)
}
console.log('==============================' + EOL)

let PORT = process.env.API_PORT || 3008

require('../app').listen(PORT)
console.log(`${EOL}starting at port ${PORT}`)
/* eslint-enable */