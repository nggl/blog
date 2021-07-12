let express = require('express'),
	app = express()


app.use(express.static('./public'))
   .use(/(\/detail|\/write)?\/upload/, express.static('./upload'))
   .set('view engine', 'ejs')
   .use(express.json())
   .use(express.urlencoded({extended: false}))


let session = require('express-session')

let sessionOption = {
	secret: 'blog secret',
	resave: false,
	saveUninitialized: true,
	cookie: {
		// secure: true,
		maxAge: 3 * 60 * 60 * 1000,
	}
}
app.use(session(sessionOption))


// 请求拦截
app.use((req, res, next) => {
	let whiteList = [/login\b/i, /regist\b/i, /^\/$/, /detail\b/i]
	if(whiteList.some(v => v.test(req.path))) next()
	else if(req.session.user) next() 
	else res.redirect('/')
})

// 文件上传
let upload = require('./common/upload')
app.use('/upload', upload)


// 页面路由
let index = require('./routes/index')

app.use('/', index)

// 默认跳转
app.use((req, res, next) => {
	let user = req.session.user || {}
	res.redirect('/')
})


let port = process.env.PORT || 3000

app.listen(port, (err) => {
	let echoIpForMac = () => {
		require('colors')
		let os = require('os')
    	let en0 = os.networkInterfaces().en0.pop()
		console.log(`server running on http://${en0.address}${port === 80 ? '' : ':' + port}`.green)
	}
	if(err) console.log(err)
	else if(port != 3000) echoIpForMac()
})