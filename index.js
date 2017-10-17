var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var regexp = require('node-regexp')
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var welcom = regexp().either('สวัสดี', 'hello').ignoreCase().toRegExp()
var reg_led1_on = regexp().start('led').maybe(' ').must(1).must(' ').either('on', 'เปิด').ignoreCase().toRegExp()
var reg_led1_off = regexp().start('led').maybe(' ').must(1).must(' ').either('off', 'ปิด').ignoreCase().toRegExp()
var reg_led2_on = regexp().start('led').maybe(' ').must(2).must(' ').either('on', 'เปิด').ignoreCase().toRegExp()
var reg_led2_off = regexp().start('led').maybe(' ').must(2).must(' ').either('off', 'ปิด').ignoreCase().toRegExp()

var reg_temperature = regexp().maybe(' ').either('อุณหภูมิ', 'temperature', 'humidity', 'temp', 'ร้อน', 'hot').ignoreCase().toRegExp()

var reg_led1_status = regexp().start('led').maybe(' ').must(1).must(' ').maybe('status').maybe('สถานะ').ignoreCase().toRegExp()
var reg_led2_status = regexp().start('led').maybe(' ').must(2).must(' ').maybe('status').maybe('สถานะ').ignoreCase().toRegExp()
var reg_status = regexp().either('status', 'สถานะ').ignoreCase().toRegExp()

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://iot.eclipse.org')

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
    
    if (welcom.test(text)) {
      sendText(sender, text);
    } else if (reg_led1_on.test(text)){
      sendLed1On();
      pushResponse(sender, ['คำสั่งทำงานเรียบร้อย']);
    }else if (reg_led1_off.test(text)){
      sendLed1Off();
      pushResponse(sender, ['คำสั่งทำงานเรียบร้อย']);
    }else if (reg_led2_on.test(text)){
      sendLed2On()
      pushResponse(sender, ['คำสั่งทำงานเรียบร้อย'])
    }else if (reg_led2_off.test(text)){
      sendLed2Off();
      pushResponse(sender, ['คำสั่งทำงานเรียบร้อย']);
    }else if (reg_led1_status.test(text)){
      ledStatus(21, sender);
    }else if (reg_led2_status.test(text)){
      ledStatus(22, sender);
    }else if (reg_status.test(text)){
      ledStatusAll(sender);
    }else if (reg_temperature.test(text)) {
      tempStatus(sender)
    }
    else{
      pushResponse(sender, ['เราไม่รู้จักรูปแบบคำสั่ง'])
    }
    res.sendStatus(200)
})

function tempStatus(sender){
  client.publish('/line/bot/temperature/get', JSON.stringify({}))
  function _onListener(msg){
    console.log(msg);
    clearTimeout(timeOut); 
    let obj = JSON.parse(msg);
    let _texts = [];
    if (obj.status === 1) {
      if (obj.temperature > 25){
        _text.push('ร้อนจัง ')
      }
      _text.push('อุณหภูมิ ' + obj.temperature + ' °c')
      _text.push('ความชื้น ' + obj.humidity + ' %')
    }else{
      _texts.push('ไม่สามารถอ่านข้อมูลจากเว็นเซ่อร์ได้')
      _texts.push('โปรดลองอีกครั้ง')
    } 
    
    pushResponse(sender, _texts) 
  }
  var timeOut = setTimeout(function() {
    ee.removeListener('/line/bot/temperature/get', _onListener);
    pushResponse(sender, ['ไมาสามารถตรวจสอบสถานะได้ในตอนนี้'])
  }, 5000);
  ee.once("/line/bot/temperature", _onListener);
}

function ledStatusAll(sender){
  client.publish('/line/bot/goio/status/get/all', JSON.stringify({}))
  function _onListener(msg){
    console.log(msg);
    clearTimeout(timeOut);
    let objs = JSON.parse(msg);
    let _tests = [];
    for(var i=0; j=objs.length,i<j; i++){
      let obj = objs[i];
      let status = obj.status == 1 ? ' เปิด' : ' ปิด';
      let msg_response = 'สถานะของ LED ' + obj.pin + status;
      _tests.push(msg_response); 
    }
    pushResponse(sender, _tests)
  }
  var timeOut = setTimeout(function() {
    ee.removeListener('/line/bot/goio/status/all', _onListener);
    pushResponse(sender, ['ไมาสามารถตรวจสอบสถานะได้ในตอนนี้'])
  }, 5000);
  ee.once("/line/bot/goio/status/all", _onListener);
}

function ledStatus(pin_number, sender){
  client.publish('/line/bot/goio/status/get', JSON.stringify({pin: pin_number}))
  function _onListener(msg){
    console.log(msg);
    clearTimeout(timeOut);
    let obj = JSON.parse(msg);
    let status = obj.status == 1 ? ' เปิด' : ' ปิด';
    let msg_response = 'สถานะของ LED ' + obj.pin + status;
    pushResponse(sender, [msg_response])
  }
  var timeOut = setTimeout(function() {
    ee.removeListener('/line/bot/goio/status', _onListener);
    pushResponse(sender, ['ไมาสามารถตรวจสอบสถานะได้ในตอนนี้'])
  }, 5000);
  ee.once("/line/bot/goio/status", _onListener);
}


function sendLed1On(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 21, status: true}))
}

function sendLed1Off(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 21, status: false}))
}

function sendLed2On(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 22, status: true}))
}

function sendLed2Off(){
  client.publish('/line/bot/gpio', JSON.stringify({pin: 22, status: false}))
}


function pushResponse (sender, text) {
  let _msg = [];
  for(var i=0; j=text.length,i<j; i++) {
    _msg.push({
      type: 'text',
      text: text[i]
    })
  }
  let data = {
    to: sender,
    messages: _msg
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

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic.toString(), message.toString())
  if (topic.toString() === '/line/bot/goio/status') {
    ee.emit('/line/bot/goio/status', message.toString());
  }

  if (topic.toString() === '/line/bot/goio/status/all') {
    ee.emit('/line/bot/goio/status/all', message.toString());
  }

  if (topic.toString() === '/line/bot/temperature') {
    ee.emit('/line/bot/temperature', message.toString());
  }

})

client.on('connect', function () {
  client.subscribe('/line/bot/goio/status')
  client.subscribe('/line/bot/goio/status/all')
  client.subscribe('/line/bot/temperature')
})

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})