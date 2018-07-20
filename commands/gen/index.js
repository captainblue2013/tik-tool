const shell = require('shelljs')
const fs = require('fs')
const readline = require('readline-sync')
const colors = require('colors')
const request = require('request-promise')
const Path = require('path')
const { EOL } = require('os')

const client = async (argv) => {
  const projectRoot = process.cwd()
  if (!fs.existsSync(`${projectRoot}/tik.json`)) {
    console.log('tik.json NOT FOUND !'.yellow)
    process.exit()
  }
  const srcRoot = `${projectRoot}/src`
  if (!fs.existsSync(`${srcRoot}/clients`)) {
    shell.mkdir(`${srcRoot}/clients`)
  }
  const appId = readline.question('输入APP_ID, 如 2015  :  '.yellow)
  let resp
  if (fs.existsSync(appId)) {
    //本地文件模式
    resp = require(appId)
  } else {
    resp = await request({
      uri: `http://172.20.160.7:${appId.replace(/\s/g, '')}/v1.0.0/swagger`,
      method: 'GET',
      json: true
    })
  }
  const { NAME, Name } = formatName(resp.info.name)
  let content = fs.readFileSync(Path.resolve(`${__dirname}/client.tpl`)).toString()
  content = content.replace(/__Name__/g, Name)
  content = content.replace(/__NAME__/g, NAME)
  for (let path in resp.paths) {
    for (let method in resp.paths[path]) {
      content = content.replace('//__FUNC__', (f => {
        let content = fs.readFileSync(Path.resolve(`${__dirname}/func.tpl`)).toString()
        content = content.replace('__name__', f.operationId)

        content = content.replace('__METHOD__', method)
        const argv = []
        const query = ['{']
        const body = ['{']
        f.parameters.forEach(p => {
          argv.push(p.name)
          switch (p.in) {
            case 'body':
              body.push(p.name + ',')
              break
            case 'query':
              query.push(p.name + ',')
              break
            case 'param':
              path = path.replace(':' + p.name, '${' + p.name + '}')
              break
            case 'headers':
              content = content.replace('//__headers__', `${p.name},${EOL}//__headers__`)
              break
              break
          }
        })
        query.push('}')
        body.push('}')
        content = content.replace('__body__', body.join('\n'))
        content = content.replace('__query__', query.join('\n'))
        content = content.replace('__path__', path)
        content = content.replace('__argv__', argv.join(','))
        return content
      })(resp.paths[path][method]))
    }
  }
  fs.writeFileSync(`${srcRoot}/clients/${resp.info.name}.js`, content)
  console.log(`File generated: ${`${srcRoot}/clients/${resp.info.name}.js`.green}`)
  fs.writeFileSync(`${srcRoot}/clients/${resp.info.name}.json`, JSON.stringify(resp, null, 2))
  console.log(`File generated: ${`${srcRoot}/clients/${resp.info.name}.json`.yellow}`)
  process.exit()
}

function formatName(name) {
  name = name.split('-')
  const Name = (name => {
    const arr = []
    name.forEach(n => {
      arr.push(n[0].toUpperCase() + n.substr(1))
    })
    return arr.join('')
  })(name)
  const NAME = (name => {
    const arr = []
    name.forEach(n => {
      arr.push(n.toUpperCase())
    })
    return arr.join('_')
  })(name)
  return {
    NAME,
    Name,
  }
}

module.exports = {
  client,
}