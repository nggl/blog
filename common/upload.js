let multer = require('multer')
let baseurl = 'upload/',
    storage = multer.diskStorage({
        filename(req, file, cb) {
            let { originalname, filename } = file
            let type = originalname.substring(originalname.lastIndexOf('.')),
                name = Date.now() + '_' + Math.floor(Math.random() * 100000) + type
            cb(null, name)
        },
        destination(req, file, cb) {
            cb(null, baseurl)
        }
    })
let upload = multer({ storage })
let router = require('express').Router()


// file
/*
  {
    fieldname: 'filedata',
    originalname: 'demo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: 'upload/',
    filename: '1603333326505_62899.png',
    path: 'upload/1603333326505_62899.png',
    size: 795793
  }
 */

// 单文件上传
router.post('/single', upload.single('file'), (req, res) => {
    res.json({err: '', msg: req.file.path})
})
// 多文件上传
router.post('/multer', upload.array('filedata'), (req, res) => {
    let [file] = req.files
    res.json({ err: '', msg: file.path })
})

module.exports = router