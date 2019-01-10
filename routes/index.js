var express = require('express');
var url = require('url');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log(123123)
    console.log(url.parse(req.url, true).query)
    res.send({aa:222});
  // res.render('index', { title: 'Express' });
});

module.exports = router;
