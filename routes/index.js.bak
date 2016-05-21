var math = require('mymath');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'PETA DWYTE' });
});


router.get('/Addition', function (request, response) {
    //debug;
    var x = Number(request.query.x),
        y = Number(request.query.y),
        result = math.addition(x, y);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ "result":  result }));
    console.log('Handled addition request for x=' + x + ' : y=' + y);
});

module.exports = router;