import Koa from 'koa'
import Router from 'koa-router'
import querystring from 'querystring'
import phantomjs from 'phantomjs-prebuilt'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'
import base64Img from "base64-img"
import chalk from "chalk"

const app = new Koa()
const router = new Router()

const getFileName = () => {
  let d = new Date()
  return [d.getFullYear(), d.getMonth()+1, d.getDate(), ~~(Math.random() * 1000)].join('')
}

app.use(async(ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.body = JSON.stringify({
      'code': -1,
      'error': err,
      'msg': ''
    })
    ctx.status = err.status || 500
  }
})

app.use(async(ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

router
  .get('/', async(ctx, next) => {
    ctx.body = 'Welcome to Website Thumbler'
    // ctx.body = os.platform()
  })
  .get('/capture*', async(ctx, next) => {
    let params = querystring.parse(ctx.url.replace(/^\/capture(\/)?\?/, ''))
    let root = __dirname
    let picDir = path.join(root, 'screenshot')
    if (params.docker && params.docker == 1) {
      picDir = '/screenshot'
    } else {
      if (!fs.existsSync(picDir)) {
        fs.mkdirSync(picDir)
      }
    }
    console.log("[" + chalk.blue('PictureDir') + "] ", picDir)
    let fileName = (!params.name || params.name === '') ? getFileName() : params.name
    let picPath = path.join(picDir, fileName + '.png')
    let cmd = [phantomjs.path, path.join(root, 'rasterize.js'), params.url, picPath].join(' ')
    console.log("["+chalk.red('CMD')+"] ", cmd)
    let code = shell.exec(cmd).code;
    let dataBuffer = new Buffer(base64Img.base64Sync(picPath).replace(/^data:image\/\w+;base64,/, ""), 'base64')
    ctx.body = dataBuffer
    ctx.type = 'image/png'
  })

app.use(router.routes())
app.listen(process.env.PORT || 8000)
