module.exports = class File {
  constructor(connection) {
    this.connection = connection 
  }

  addFile (filename) {
    return new Promise((resolve, reject)=> {
      let date = new Date().toISOString().slice(0, 19).replace('T', ' ')
      this.connection.query({
        sql: 'INSERT INTO file (filename, uploadAt) VALUES (?, ?)',
        timeout: 40000, // 40s
        values: [filename, date]
        }, function (error, results, fields) {
        if (!error) {
          resolve(results)
        } else {
          throw new Error (error)
        }
      })
    })
  }

  getAll() {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'SELECT * FROM file',
        timeout: 40000,
        }, function (error, results, fields) {
          if (error) {
            throw new Error (error)
          }
          
          resolve(results)
      })
    })
  }

  getFilename (id) {
    return new Promise((resolve, reject)=> {
      this.connection.query({
        sql: 'SELECT filename FROM file WHERE id = ?',
        timeout: 40000,
        values: [id]
        }, function (error, results, fields) {
          if (error) {
            throw new Error (error)
          }
          
          resolve(results[0].filename)
      })
    })
  }
}