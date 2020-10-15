let rowsAffected = [];

const pool = {
  close,
  request () {
    return {
      query() {
        return {
          rowsAffected
        }
      }
    };
  }
}

function close () {}
function __setToFail() {
  rowsAffected = [1];
}
function __setToSuccess() {
  rowsAffected = [];
}

class ConnectionPool {
  constructor (instance) {
    this.instance = instance;
  }
  async connect () {
    return pool;
  }
}

module.exports = {
  close,
  ConnectionPool,
  __setToFail,
  __setToSuccess
}