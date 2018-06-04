
const mysql = require('mysql');

class MySQL {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  query(str, obj) {
    return new Promise((resolve, reject) => {
      this.connection.query(str, obj, (err,res) => {
        if (err){ 
          throw err
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  destroy() {
    return new Promise((resolve,reject) => {
      this.connection.destroy(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      })
    })
  }

}

module.exports = MySQL;
