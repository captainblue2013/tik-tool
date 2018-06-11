const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const readline = require('readline-sync')
const { EOL } = require('os')
const Err = require('../utils/error_handler')
const project = {}

project.create = (argv) => {
  let projectName = argv._[1]

  if (!projectName) {
    Err('Project Name Required!')
    return
  }

  let root = `${process.cwd()}/${projectName}`
  if (fs.existsSync(root)) {
    Err(`Directory [ ${root} ] has already exists`)
    return
  }
  //todo 检验名字合法性
  let items = ['api', 'cronjob']
  let type = items[readline.keyInSelect(items, 'Project Type:')]
  if (!type) {
    console.log('DO NOTING!'.yellow)
    process.exit()
  }


  let cmd = `mkdir ${root} && cp -a ${path.resolve(`${__dirname}/../tpl/${type}`)}/. ${root} `
  if (shell.exec(cmd).code !== 0) {
    Err(`Create Project Failed`)
    return
  }
  if (shell.sed('-i', 'tik-tik', projectName, `${root}/package.json`).code !== 0) {
    Err(`Init package.json Failed`)
    return
  }
  if (shell.sed('-i', 'tik-tik', projectName, `${root}/.env`).code !== 0) {
    Err(`Init .env Failed`)
    return
  }
  if (shell.sed('-i', 'tik-tik', projectName, `${root}/tik.json`).code !== 0) {
    Err(`Init tik.json Failed`)
    return
  }
}

project.release = (argv) => {
  let tikConfig = {
    group: null,
    name: null,
    version: '1.0.0'
  }
  if (fs.existsSync(`${process.cwd()}/tik.json`)) {
    tikConfig = require(`${process.cwd()}/tik.json`)
  }

  if (!tikConfig.group) {
    tikConfig.group = readline.question('Set gitlab group for this repo: (e.g tikcoin )')
    fs.writeFileSync(`${process.cwd()}/tik.json`, JSON.stringify(tikConfig, null, 2))
  }
  if (!tikConfig.name) {
    tikConfig.name = readline.question('Set repo-name : (e.g tikcoin-api)')
    fs.writeFileSync(`${process.cwd()}/tik.json`, JSON.stringify(tikConfig, null, 2))
  }

  console.log(`${EOL}Current version is ${tikConfig.version.yellow}${EOL}`)
  let select = versionSelect(tikConfig.version)
  let newVersion = readline.keyInSelect(select.name, 'You should know that what you are doing !')
  if (newVersion !== -1) {
    if (shell.exec(`git branch release/${select.arr[newVersion]} && git checkout release/${select.arr[newVersion]}`).code !== 0) {
      console.log('something wrong!'.red)
      process.exit()
    }
    tikConfig.version = select.arr[newVersion] || tikConfig.version
    fs.writeFileSync(`${process.cwd()}/tik.json`, JSON.stringify(tikConfig, null, 2))
    console.log('Done !'.green)
  } else {
    console.log('Cancel !'.yellow)
  }
}

function versionSelect(version) {
  let bits = version.split('.')
  let patch = [bits[0], bits[1], bits[2] * 1 + 1].join('.')
  let feature = [bits[0], bits[1] * 1 + 1, '0'].join('.')
  let major = [bits[0] * 1 + 1, '0', '0'].join('.')
  return {
    arr: [
      patch,
      feature,
      major,
    ],
    name: [
      'patch:' + patch,
      'feature:'.green + feature,
      'major:'.red + major,
    ],
  }
}


module.exports = project