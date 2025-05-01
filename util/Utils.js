const fs = require('fs')

async function publicIPV4() {
  const res = await fetch("https://ipecho.io/json");
  const data = await res.json();
  return data.ip;
}

function replaceLine(filePath, searchString, toReplace) {
  fs.readFile(filePath, 'utf8', function(err, data) {
    let re = new RegExp('^.*' + searchString + '.*$', 'gm')
    let formatted = data.replace(re, toReplace)

    fs.writeFile(filePath, formatted, 'utf8', function(err) {
      if (err) console.log(err)
    })
  })
}

module.exports = {  publicIPV4, replaceLine }
