let router = require('express').Router()

let moment = require('moment')
moment.locale('zh-CN')

let {
	addUser,
	findUser,
	findUsersCount,
	getUserInfo,
} = require('../models/userModel')

router.route('/login')
      .get((req, res) => {
	 		res.render('pages/user/login', {user: {}})
	  })
	  .post( async (req, res) => {
	  	let {name, password} = req.body
	  	try {
	  		if(!(name.trim && name.trim())) {
	  			throw new Error('用户名不可为空')
	  		}
	  		if(!(password.trim && password.trim())) {
	  			throw new Error('用户密码不可为空')
	  		}
	  		let doc = await findUser({name, password})
	  		// console.log(doc)
	  		if(doc && doc.name) {
		  		req.session.user = doc
		  		res.redirect('/user')
	  		} else {
	  			throw new Error(`无 ${name} 用户信息`)
	  		}
	  	} catch(e) {
			res.render('public/error', {
				title: '提示', 
				message: e.message
			})
	  	}
	  })

router.get('/logout', (req, res) => {
	req.session.user = ''
	res.redirect('/')
})

router.get('/user', async(req, res) => {
	let user = req.session.user || {}
	let result = await getUserInfo(user._id)
	let {articles} = result
	if(articles.length) {
		result.articles = articles.map(v => {
			v.date = moment(v.date).format('YYYY-MM-DD HH:mm:ss')
			// v.update = v.update ? moment(v.update).format('YYYY-MM-DD HH:mm:ss') : ''
			v.update = v.update ? moment(v.update).fromNow() : ''
			return v
		})
	}
	res.render('pages/user/index', {data: result, user})
})

router.route('/regist')
	  .get((req, res) => {
	  	res.render('pages/user/regist', {user: {}})
	  })
	  .post( async (req, res) => {
	  	let {name, password, password1} = req.body

	  	try {
		  	if(password != password1) {
		  		throw new Error(`两次密码输入不一致`)
		  	}
		  	if(typeof name == 'string' && name.trim()) {
				let counts = await findUsersCount({name})
				if(counts > 0) {
					throw new Error(`用户已存在`)
				}
	  		} else {
				throw new Error(`必须输入用户名`)
			}
		  	await addUser({name, password})
	  		let doc = await findUser({name, password})
	  		if(typeof doc.name === 'string' && doc.name.trim()) {
	  			req.session.user = doc
	  			res.redirect('/user')
	  		} else {
	  			res.redirect('/')
	  		}
		} catch(e) {
			res.render('public/error', {
				title: '提示', 
				message: e.message
			})
	  	}
	  })

let {
	addArticle,
	getArticleAndRecomment,
	findArticle,
	selectArticle,
	getCount,
	patchArticle,
	findAndDelArticle,
} = require('../models/articleModel')

router.get('/', async (req, res) => {
	let user = req.session.user || {}
	let {page, q, limit} = req.query
	if(!page) page = 1
	if(limit > 0) limit -= 0
	else limit = 0
	let pageSize = limit || 10
	let docs = await selectArticle(page, pageSize, q)
	let count = await getCount(q)
	let total = Math.ceil(count / pageSize)
	docs = docs.map(v => {
		v.isCan = v.auth == user.name
		v.update = v.update ? moment(v.update).fromNow() : ''
		return v
	})
	res.render('index', {
		user, 
		data: {
			total, 
			list: docs,
			curPage: page,
			q,
			limit: pageSize,
		}
	})
})

router.route('/write/:id?')
	  .get(async(req, res) => {
	  	let user = req.session.user || {}
	  	let {id} = req.params,
	  		{page} = req.query
	  	if(id) {
	  		let doc = await findArticle(id)
	  		res.render('pages/write/index', {user, data: doc, page})
	  	} else res.render('pages/write/index', {user, data: {}, page})
	  })
	  .post(async(req, res) => {
	  	let {id, title, content} = req.body
	  	let auth = req.session.user.name || ''
	  	let page = req.body.page || 1
	  	let authid = req.session.user._id || ''
	  	if(id) { 
	  		// 更新操作
	  		patchArticle(id, {title, content, auth, authid})
	  	} else { 
	  		// 添加操作
	  		addArticle({title, content, auth, authid, update: Date.now()})
	  	}
	  	/*let path = '/'
  		if(page > 1) path += '?page=' + page
	  	res.redirect(path)*/
	  	res.redirect('pages/user/user')
	})

router.get('/detail/:id', async(req, res) => {
			let user = req.session.user || ''
			let doc = await getArticleAndRecomment(req.params.id)
			doc.date = moment(doc.date).fromNow()
			doc.update = doc.update ? moment(doc.update).fromNow() : ''
			doc.recs.map(v => {
				// v.date = moment(v.date).format('YYYY-MM-DD HH:mm:ss')
				v.date = moment(v.date).format('YYYY-MM-DD')
				v.update = v.update ? moment(v.update).format('YYYY-MM-DD HH:mm:ss') : ''
				return v
			})
			// console.log(doc)
			res.render('pages/detail/index', {user, data: doc})
		}
	).get('/del/:id', async(req, res) => {
		let {page} = req.query,
			{id} = req.params
		let result = await findAndDelArticle(id)
		let docs = await selectArticle(page)
		// if(docs.length) res.redirect('/?page=' + page)
		// else res.redirect('/?page=' + (page - 1 > 1 ? page - 1 : 1))
		res.redirect('pages/user/index')
	})

module.exports = router