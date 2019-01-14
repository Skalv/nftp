const express = require('express')
const app = express()
var mysql      = require('mysql')
var bodyParser = require('body-parser')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'nftp'
});
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

const ServerModel = require('./Models/server.js')
const Server = new ServerModel(connection)


app.set('views', __dirname + '/views');
app.set('view engine', 'twig');

app.get('/', async function (req, res) {
  let servers = await Server.getAll()

  res.render('index.twig', {
    servers: servers
  })
})

app.post('/addsrv', function (req, res) {
  connection.query({
    sql: 'INSERT INTO server (name, ip, mask, mac) VALUES (?, ?, ?, ?)',
    timeout: 40000, // 40s
    values: [req.body.srvName, req.body.srvIP, req.body.srvMask, req.body.srvMac]
  }, function (error, results, fields) {
    if (!error) {
      res.redirect('/');
    }
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})