const express  = require('express')
const app      = express()
var mysql      = require('mysql')
var bodyParser = require('body-parser')
var multer     = require('multer')

// Parametres de multer, pour l'envois de fichier au serveur
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
var upload = multer({ storage: storage })

// Initialisation de bodyParser;
// Permet de récupérer simplement les données envoyées au serveur
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// inzitialisation de la BDD
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'nftp'
});

// Initialisation des models
const ServerModel = require('./Models/server.js')
const Server = new ServerModel(connection)
const FileModel = require('./Models/file')
const File = new FileModel(connection)
const TrameModel = require('./Models/trame')
const Trame = new TrameModel(Server, connection)

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
app.get('/', async function(req, res) {
  let files = await File.getAll()
  res.render('index.twig', {
    files: files
  })
})

app.post('/addTramfile', upload.single('tramfile'), async function(req, res) {
  await File.addFile(req.file.filename)
  res.redirect('/')
})

app.get('/processFile/:id', async function(req, res) {
  let filename = await File.getFilename(req.params.id)
  await Trame.process(filename)
  res.redirect('/processResult')
})

app.get('/processResult', async function(req, res) {
  let badtrames = await Trame.getBad()
  res.render('result.twig', {
    badtrames: badtrames
  })
})

// Lancement du serveur
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})