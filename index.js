var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var Token = 'ZHLMOCrQQ5M2BEhqiMDm4GxgEfy6KHsSKsRvsM/J5e930EtHsVRP7ofmrraP/+SyIYlTNFJB/qkdx49RuztNbdr3JyLb4Q7duN48ulGeUrVqieJAC+UYeq4IDvqeD4sukILDZrYIL03z5q80uYdSMAdB04t89/1O/w1cDnyilFU=';

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
      sendText(replyToken, text)
    }
    res.sendStatus(200)
})

function sendText (sender, text) {
    let data = {
      replyToken: sender,
      messages: [
        {
          type: 'text',
          text: 'สวัสดีค่ะ เราเป็นผู้ช่วยปรึกษาด้านความรัก สำหรับหมามิ้น 💞'
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

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})