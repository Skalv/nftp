const express = require('express')
const app = express()
var mysql      = require('mysql')
var bodyParser = require('body-parser')

// Initialisation de bodyParser;
// Permet de récupérer simplement les données envoyées au serveur
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// initialisation de la BDD
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

// Initialisation des models
const ServerModel = require('./Models/server.js')
const Server = new ServerModel(connection)

// Ajout du moteur de template TWIG
app.set('views', __dirname + '/views');
app.set('view engine', 'twig');

// Routes pour la gestion des serveurs
app.get('/srv', async function (req, res) {
  let servers = await Server.getAll()

  res.render('srv.twig', {
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
      res.redirect('/srv');
    }
  });
})

// Route pour l'analyse des trames
app.get('/', function(req, res) {
  res.render('index.twig', {
    
  })
})

// Lancement du serveur
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})