var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1:27017/BS';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));


var http = require('http').Server(app);
var io = require('socket.io')(http);
var SocketHandler = require('./controllers/socketController');

var roomInfo = {};
io.on('connection', async (socket) => {
  console.log('a user connected');
  socketHandler = new SocketHandler();

  var url = socket.request.headers.referer;
  var channel = url.split('/');
  var roomID = channel[channel.length - 1];
  var user = "";
  var private = channel[channel.length - 2];

  socket.on('join', function (userID) {
    user = userID;
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = [];
    }
    var index = roomInfo[roomID].indexOf(user);
    if (index == -1) {
      roomInfo[roomID].push(user);
    }
    socket.join(roomID);
    console.log(user + ' join ' + roomID);
    console.log(roomInfo[roomID]);
  });

  // socket.on('leave', function (userID) {
  //   socket.emit('disconnect', userID);
  // });

  socket.on('disconnect', function () {
    // user = userID;
    var index = roomInfo[roomID].indexOf(user);
    if (index != -1) {
      roomInfo[roomID].splice(index, 1);
    }
    socket.leave(roomID);
    console.log(user + ' quit ' + roomID);
    console.log(roomInfo[roomID]);
  });

  // socket.on("msg", (obj) => {
  //   console.log("socket.on\n");
  //   socketHandler.storeMsg(obj);
  //   console.log("storeMsg\n");
  //   io.emit("msg", obj);
  //   console.log("io.emit\n");
  // });
  if (private == "users") {
    socket.on('msg', (obj) => {
      if (roomInfo[user].indexOf(roomID) == -1) {
        return false;
      }
      console.log("socket.on");
      socketHandler.storeMsg(obj);
      console.log("storeMsg");
      io.to(user).emit("msg", obj);
      io.to(roomID).emit("msg", obj);
      console.log("io.emit");
    });

  }
  else {
    socket.on('msg', (obj) => {
      if (roomInfo[roomID].indexOf(user) == -1) {
        return false;
      }

      console.log("socket.on");
      socketHandler.storeMsg(obj);
      console.log("storeMsg");
      io.to(roomID).emit("msg", obj);
      console.log("io.emit");
    });
  }

});

http.listen(3001, function () {
  console.log('listening on *:3001');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
