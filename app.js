import Koa from 'koa'
import Router from 'koa-router'
import querystring from 'querystring'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'

const app = new Koa()
const router = new Router()

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.body = err
        ctx.status = err.status || 500
    }
})

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

const doShell = function (cmd) {
    return new Promise((resolve, reject) => {
        let res = shell.exec(cmd)
        if (res.code == 0) resolve(res.code)
        else reject(-1)
    })
}

const jsonParse = function (obj) {
    return JSON.stringify(obj)
}

router
    .get('/', async (ctx, next) => {
        ctx.body = 'Welcome to Website Thumbler'
    })
    // .param('url', async(url, next) => {
    //     console.log(ctx.params);
    //     await next()
    // })
    .get('/capture*', async (ctx, next) => {
        let root = __dirname
        let picDir = path.join(root, 'screenshot')
        if(!fs.existsSync(picDir)){
            fs.mkdirSync(picDir)
        }
        let params = querystring.parse(ctx.url.replace(/\/capture(\/)?\?/, ''))
        let cmd = [path.join(root, 'bin/phantomjs'), path.join(root, 'rasterize.js'), params.url, path.join(picDir, params.name)].join(' ')
        //console.log(cmd)
        //ctx.body = 'RUN:' + cmd
        let code = await doShell(cmd)
        ctx.body = jsonParse({'code': code, 'msg': ''})
    })

app.use(router.routes());
app.listen(3000);
