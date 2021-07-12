let {link, ObjectId} = require('../config/Db')

let db = null

async function connect() {
	db = await link()
}
connect()

exports.addUser = async (data) => {
	// let db = await link()
	let res = await db.collection('users')
					  .insertOne(data)
	return res
}

exports.findUser = async (data) => {
	// let db = await link()
	let res = await db.collection('users')
					  .findOne(data, {projection: {name: 1}})
	return res
}

exports.findUsersCount = async (data) => {
	// let db = await link()
	let res = await db.collection('users')
					  .countDocuments(data)
	return res
}

let {findArticles} = require('./articleModel')

exports.getUserInfo = async (authid) => {
	// console.log(authid)
	let info = await db.collection('users')
					   .findOne({_id: ObjectId(authid)}, {projection: {password: 0}})
	info.articles = await findArticles({authid}, {projection: {content: 0}, sort: {update: -1}})
	return info
}