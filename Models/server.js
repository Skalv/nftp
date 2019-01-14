module.exports = class Server {
  constructor(connection) {
    this.connection = connection 
  }

  getAll () {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'SELECT * FROM server',
        timeout: 40000, // 40s
        }, function (error, results, fields) {
        if (!error) {
          resolve(results)
        } else {
          resolve({})
        }
      })
    })
  }
}