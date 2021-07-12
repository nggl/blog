let {MongoClient, ObjectId } = require('mongodb')

let DBLINK = 'mongodb://root:123456@10.211.55.24:27017/'

let link = (DBNAME = 'blog') => {
	return new Promise((resolve, reject) => {
		MongoClient.connect(DBLINK, {
			useNewUrlParser: true, 
			useUnifiedTopology: true,
		}, 
		(err, client) => {
			if(err) reject(err)
			else resolve(client.db(DBNAME))
		})
	})
}

module.exports = {link, ObjectId}