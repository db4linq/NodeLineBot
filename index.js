var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://103.13.228.61')

var Token = 'IX1RkhYoWtVnfpRKkxVHJKedPosV7hO/XYHsWRQ09ai0DV0YuBHN9SNOFFXijiU2IYlTNFJB/qkdx49RuztNbdr3JyLb4Q7duN48ulGeUrWN8rzj3g5aDeWg+baY4akHER3FKDAaa7mtVZQ2xvnM4AdB04t89/1O/w1cDnyilFU=';

app.get('/', function (req, res) {
	res.send('Hello')
})

app.post('/webhook', (req, res) => {
    var text = req.body.events[0].message.text
    var sender = req.body.events[0].source.userId
    var replyToken = req.body.events[0].replyToken
    console.log(text, sender, replyToken)
    console.log(typeof sender, typeof text)
    console.log(req.body.events[0])
    if (text === 'สวัสดี' || text === 'Hello' || text === 'hello') {
      sendText(sender, text)
    } else if (text === 'LED ON' || text === 'led on'){
      sendLedOn()
      sendResponse(sender, 'คำสั่งทำงานเรียบร้อย')
    }else if (text === 'LED OFF' || text === 'led off'){
      sendLedOff()
      sendResponse(sender, 'คำสั่งทำงานเรียบร้อย')
    }else{
      sendResponse(sender, 'เราไม่รู้จักรูปแบบคำสั่ง')
    }
    res.sendStatus(200)
})

function sendLedOn(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 23, status: true}))
}

function sendLedOff(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 23, status: false}))
}


function sendResponse (sender, text) {
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: text
      } 
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + Token
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}

function sendText (sender, text) {
    let data = {
      to: sender,
      messages: [
        {
          type: 'text',
          text: 'สวัสดีค่ะ เราเป็นผู้ช่วยปรึกษาด้าน IoT'
        },
        {
          type: 'text',
          text: 'มีอะไรให้เรารับใช้'
        }
      ]
    }
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Token
      },
      url: 'https://api.line.me/v2/bot/message/push',
      method: 'POST',
      body: data,
      json: true
    }, function (err, res, body) {
      if (err) console.log('error')
      if (res) console.log('success')
      if (body) console.log(body)
    })
}

client.on('connect', function () {
  client.subscribe('presence')
  client.publish('presence', 'Hello mqtt')
})

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})