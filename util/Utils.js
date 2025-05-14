const fs = require('fs')
const config = require('@root/config.json')
const axios = require('axios').default

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

async function findPort() {
  const portData = await require("mongoose").connection.collection('users').find({}).toArray()

  portData.forEach((port) => {
    console.log(port)
  })
}

async function findPort() {
  const userData = await require("mongoose").connection.collection('users').find({}).toArray()

  let lastSeverPort = 25576
  let nextPort

  for (let i = 0; i < userData.length; i++) {
      const currentPort = userData[i].serverPort

      if (currentPort == lastSeverPort) {
        lastSeverPort++
        nextPort = lastSeverPort
      } else {
        nextPort = lastSeverPort
        break
      }
  }

  return nextPort
}

async function configureSubdomain(name, port, publicIP) {
  // Create A record
  await axios.put(`https://developers.hostinger.com/api/dns/v1/zones/basedes.com`,
    {
      "overwrite": true,
      "zone": [
        {
          "name": name,
          "records": [
            {
              content: publicIP
            }
          ],
          "ttl": 120,
          "type": "A"
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.hostingerApiKey}`
      },
    }
  )

  await axios.put(`https://developers.hostinger.com/api/dns/v1/zones/basedes.com`,
    {
      "overwrite": true,
      "zone": [
        {
          "name": `_minecraft._tcp.${name}`,
          "records": [
            {
              content: `0 0 ${port} ${name}.basedes.com`
            }
          ],
          "ttl": 120,
          "type": "SRV"
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.hostingerApiKey}`
      },
    }
  )
}

module.exports = {  publicIPV4, replaceLine, findPort, configureSubdomain }
