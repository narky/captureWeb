import Koa from 'koa'
import Router from 'koa-router'
import querystring from 'querystring'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'
import base64Img from "base64-img"

const app = new Koa()
const router = new Router()

const jsonParse = function (obj) {
    return JSON.stringify(obj)
}

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.body = jsonParse({'code': -1, 'error': err, 'msg': ''})
        ctx.status = err.status || 500
    }
})

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

router
    .get('/', async (ctx, next) => {
        ctx.body = 'Welcome to Website Thumbler'
    })
    .get('/capture*', async (ctx, next) => {
        let params = querystring.parse(ctx.url.replace(/^\/capture(\/)?\?/, ''))
        let root = __dirname
        let picDir = path.join(root, 'screenshot')
        if (params.docker && params.docker == 1) {
            picDir = '/screenshot'
        } else {
            if(!fs.existsSync(picDir)){
                fs.mkdirSync(picDir)
            }
        }
        console.log("==PictureDir==", picDir)
        let picPath = path.join(picDir, params.name+'.png')
        let cmd = [path.join(root, 'bin/phantomjs'), path.join(root, 'rasterize.js'), params.url, picPath].join(' ')
        console.log('==Run CMD==', cmd)
        let code = shell.exec(cmd).code;
        let dataBuffer = new Buffer(base64Img.base64Sync(picPath).replace(/^data:image\/\w+;base64,/, ""), 'base64')
        ctx.body = dataBuffer
        ctx.type = 'image/png'
    })

app.use(router.routes());
app.listen(process.env.PORT || 8000);
