let {link, ObjectId} = require('../config/Db')


let db = null

async function connect() {
	db = await link()
}
connect()

exports.addArticle = async (data) => {
	let res = await db.collection('articles')
					  .insertOne(data)
	return res
}

exports.selectArticle = async (page = 1, pageSize = 2, querystr = '') => {
	let filter = {}
	if(querystr != '') {
		let reg = new RegExp(querystr, 'ig')
		filter = {
			$or: [
	  			{title: reg},
	  			{auth: reg}
	  		]
		}
	}
	let res = await db.collection('articles')
					  .find(filter, {sort: {_id: -1}})
					  .skip((page - 1) * pageSize)
					  .limit(pageSize)
					  .toArray()
	return res
}

exports.getCount = async (querystr = '') => {
	let filter = {}
	if(querystr != '') {
		let reg = new RegExp(querystr, 'ig')
		filter = {
			$or: [
	  			{title: reg},
	  			{auth: reg}
	  		]
		}
	}
	let res = await db.collection('articles')
					  .countDocuments(filter)
	return res
}

exports.getArticleAndRecomment = async (id) => {
	// 全部关联
	/*let [res] = await db.collection('articles')
					  .aggregate([
					  		{$match: {_id: ObjectId(id)}},
					  		{$lookup: {
					  			from: 'articles',
							  	localField: 'auth',
							  	foreignField: 'auth',
							  	as: 'recs',
					  		}},
					  		{$project: {'recs.content': 0, 'recs.auth': 0}},
					  		{$sort: {'recs._id': -1}},
					  	])
					  .toArray()
	res.date = ObjectId(res._id).getTimestamp()
	res.recs.map(v => {
		v.date = ObjectId(v._id).getTimestamp()
	})
	return res*/
	// 部分关联
	// 限定推荐条数，按照新旧进行排序
	let single = await db.collection('articles')
						 .findOne({_id: ObjectId(id)})
	let recomments = await db.collection('articles')
							 .find({auth: single.auth}, {project: {content: 0, auth: 0}, sort: {_id: -1}, limit: 5})
							 .toArray()
	single.date = ObjectId(single._id).getTimestamp()
	recomments = recomments.map(_ => ({..._, date: ObjectId(_._id).getTimestamp()}))

	return {
		...single,
		recs: recomments,
	}
	
}
exports.findArticle = async (id, projection) => {
	let res = await db.collection('articles')
					  .findOne({_id: ObjectId(id)}, {projection})
	return res
}
exports.findArticles = async(query, options) => {
	let res = await db.collection('articles')
			          .find(query, options)
			          .toArray()
	res = res.map(v => {
		v.date = ObjectId(v._id).getTimestamp()
		return v
	})
	return res
}
exports.findAndDelArticle = async (id) => {
	let res = await db.collection('articles')
					  .findOneAndDelete({_id: ObjectId(id)})
	return res
}

exports.patchArticle = async (id, data) => {
	let res = await db.collection('articles')
					  .findOneAndUpdate({_id: ObjectId(id)}, {$set: {...data, update: Date.now()}})
	return res
}