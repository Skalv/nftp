var fs = require('fs');

module.exports = class Trame {
  constructor (server, connection) {
    this.Server = server
    this.connection = connection
  }

  getIndex (mask) {
    for (let index = 0; index < mask.length; index++) {
      if (parseInt(mask[index]) < 255) {
        return index
      }
    }
  }
  
  getFirstIp(magicVal, ip, index) {
    let multipleBefore = 0;
    let ipIndex = parseInt(ip[index])
    while (multipleBefore < ipIndex) {
      multipleBefore += magicVal
    }
    multipleBefore -= magicVal
    let firstIp = []
    for (let i=0; i<ip.length; i++) {
      if (i < index) {
        firstIp.push(ip[i])
      } else if (i === index) {
        firstIp.push(multipleBefore.toString())
      } else {
        firstIp.push("0")
      }
    }

    return firstIp
  }

  getLastIp(magicVal, ip, index) {
    let multipleBefore = 0;
    let ipIndex = parseInt(ip[index])
    while (multipleBefore < ipIndex) {
      multipleBefore += magicVal
    }
    multipleBefore -= 1
    let firstIp = []
    for (let i=0; i<ip.length; i++) {
      if (i < index) {
        firstIp.push(ip[i])
      } else if (i === index) {
        firstIp.push(multipleBefore.toString())
      } else {
        firstIp.push("255")
      }
    }

    return firstIp
  }

  compare (server, ipSource) {
    let maskServ = server.mask.split('.')
    let ipSrv = server.ip.split('.')
    let ipSrc = ipSource.split('.')

    let index = this.getIndex(maskServ)
    let magicVal = 256 - parseInt(maskServ[index])

    let firstIp = this.getFirstIp(magicVal, ipSrv, index) 
    let lastIp =  this.getLastIp(magicVal, ipSrv, index)

    for (let i = 0; i < 4; i++) {
      let fByte = parseInt(firstIp[i])
      let lByte = parseInt(lastIp[i])
      let srcByte = parseInt(ipSrc[i])

      if (srcByte < fByte || srcByte > lByte) {
        return false
      }
    }

    return true
  }

  async getBad () {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'SELECT * FROM badTrame, server WHERE badTrame.serverId = server.id',
        timeout: 40000, // 40s
        }, function (error, results, fields) {
        if (!error) {
          console.log(results)
          resolve(results)
        } else {
          resolve({})
        }
      })
    })
  }

  async saveTrame (server, ipSrc, macAddSrc) {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'INSERT INTO badTrame (serverId, ipSrc, macAddSrc) VALUES (?, ?, ?)',
        timeout: 40000, // 40s
        values: [server.id, ipSrc, macAddSrc]
        }, function (error, results, fields) {
        if (!error) {
          resolve(results)
        } else {
          throw new Error (error)
        }
      })
    })
  }

  async setProcessed(filename) {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'UPDATE file SET processed = 1 WHERE filename = ?',
        timeout: 40000, // 40s
        values: [filename]
        }, function (error, results, fields) {
        if (!error) {
          resolve(results)
        } else {
          throw new Error (error)
        }
      })
    })
  }

  async process (filename) {
    // On récup tous les serveurs
    const serversList = await this.Server.getAll()
    // On récup le fichier de trame dans le dossier uploads
    fs.readFile('uploads/'+filename, 'utf8', async (err, data) => {
      if (err) throw err
      let trames = JSON.parse(data)
      // Pour chaque trame du fichier
      trames.forEach(async trame => {
        // On récup les ips sources et destination
        let ipSrc = trame._source.layers.ip['ip.src']
        let ipDst = trame._source.layers.ip['ip.dst']
        // On regarde si l'ip de destination appartient à un serveur
        serversList.forEach(async server => {
          if (server.ip === ipDst) {
            // On test si l'ip Source est dans le même sous réseau que le serveur
            if (!this.compare(server, ipSrc)) {
              // On est pas dans le même sous réseau
              // Ce n'est pas une connexion autorisé
              // On la sauvegarde en BDD
              await this.saveTrame(server, ipSrc, trame._source.layers.eth['eth.src'])
            }
          }
        })
      });
      // Une fois le fichier analyser on l'indique en BDD
      await this.setProcessed(filename)
    });
  }
}