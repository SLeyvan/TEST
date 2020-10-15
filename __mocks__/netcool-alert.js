async function postAlert(msg) {
  await setTimeout(() => {
    console.log('Alerted message:', msg);
  }, 1)
}

module.exports = {
  postAlert
}