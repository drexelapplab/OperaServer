//SERVER File for MEAN Opera App
//todo: separate into multiple files

//Require Dependencies
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var socketIO = require('socket.io');
var mongoose = require('mongoose');

//Set up Server to use both express for REST and socket.io for real time socket programming
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

//MONGOOSE
// mongoose is a middleware for mongodb that enforces structured data and allows db to be taken care of in node
// connect to db
mongoose.connect('mongodb://localhost/Opera');
//create schema to enforce for db
var Schema = mongoose.Schema;
//set up simple schema for messages; each entry will look like this JSON: {text: String}
var MessageSchema = new Schema({text: String},{ minimize: false });
var Message = mongoose.model('Message', MessageSchema);

//return the HTML Views for each angular app when requested
//display angular app
app.get('/display', function(req, res){
  res.sendFile(__dirname +'/display.html');
});
//editor angular app
app.get('/editor', function(req, res){
  res.sendFile(__dirname +'/editor.html');
});

//EXPRESS
//express is a routing middleware for node that allows you to manipulate data more easily with different modules

//set up bodyparser
app.use(bodyParser.json());

//GET all messages fom db
app.get('/all', function(req,res) {
  //call to mongo instance (blank query == all)
  Message.find({}).then(function(dbMessages) {
    res.json(dbMessages);
  });
});

// POST messages to db
app.post('/add', function(req,res) {

  //enforce schema by assigning each prop manually
  var message = new Message();
  var prop;
  for (prop in req.body) {
    message[prop] = req.body[prop];
  }

  if (req.body.hasOwnProperty("_id")){
    //if _id included, update existing message
    Message.update({_id: req.body._id}, message).then(function() {
      res.json({'status': 'updated','message':message});
    });
  } else {
    //if _id not included, add new message
    //NOTE: .save() is called on the schema obj instance NOT the db (lowercase m)
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
    //send socket.io message to all clients
    io.emit('toDisplay',{message: dbMessages[req.params.index].text});
  });
  res.json({status:"sent"});
});

//SOCKET.IO Set up
io.on('connection', function(socket)
{
  console.log('Client connected.');
  socket.on('disconnect', function() {
    console.log('Client disconnected.');
  });
});

server.listen(8000);


