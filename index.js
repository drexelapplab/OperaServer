//Require Dependencies
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var socketIO = require('socket.io');
var mongoose = require('mongoose');

//Server Setup
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

//MONGOOSE
//connect to db
mongoose.connect('mongodb://localhost/Opera');
//create schema to enforce for db
var Schema = mongoose.Schema;
var MessageSchema = new Schema({text: String},{ minimize: false });
var Message = mongoose.model('Message', MessageSchema);

//HTML Views
//display
app.get('/display', function(req, res){
  res.sendFile(__dirname +'/display.html');
});
//editor
app.get('/editor', function(req, res){
  res.sendFile(__dirname +'/editor.html');
});

//EXPRESS

app.use(bodyParser.json());

//GET all messages fom db
app.get('/all', function(req,res) {
  Message.find({}).then(function(dbMessages) {
    res.json(dbMessages);
  });
});

// POST messages
app.post('/add', function(req,res) {
  if (req.body.hasOwnProperty("_id")){
    //if _id included, update existing message
    var message = new Message();
    var prop;
    for (prop in req.body) {
      message[prop] = req.body[prop];
    }
    Message.update({_id: req.body._id}, message).then(function() {
      res.json({'status': 'updated','message':message});
    });
  } else {
    //if _id not included, add new message
    var message = new Message();
    var prop;
    for (prop in req.body) {
      message[prop] = req.body[prop];
    }
    message.save().then(function(dbMessage) {
      res.json({'status': 'added','message':dbMessage});
    });
  }
});

//POST for delete
app.post('/delete', function(req,res) {
  if (req.body.hasOwnProperty("_id")){
    //if _id included, delete existing message
    Message.remove({_id: req.body._id}).then(function() {
      res.json({'status': 'removed'});
    });
  } else {
    res.json({'status': 'not removed'});
  }
});

//GET to forward next message
app.get('/push/:index', function(req,res) {
  Message.find({}).then(function(dbMessages) {
    io.emit('toDisplay',{message: dbMessages[req.params.index].text});
  });
  res.json({status:"sent"});
});

//SOCKET.IO
io.on('connection', function(socket)
{
  console.log('Client connected.');
  socket.on('disconnect', function() {
    console.log('Client disconnected.');
  });
});

server.listen(8000);


