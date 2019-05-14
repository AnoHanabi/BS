var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var Aggregation = require("./models/aggregation");
var Channel = require("./models/channel");
var FeedParser = require('feedparser');
var request = require('request');

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

    if (private == "aggregation") {
      var gid = channel[channel.length - 3];
      Aggregation.findOne({ "user": user, "group": gid })
        .exec(function (err, found_aggregation) {
          if (found_aggregation._id == roomID) {
            for (var i = 0; i < found_aggregation.channel.length; i++) {
              var room_ID = found_aggregation.channel[i];
              if (!roomInfo[room_ID]) {
                roomInfo[room_ID] = [];
              }
              var index = roomInfo[room_ID].indexOf(user);
              if (index == -1) {
                roomInfo[room_ID].push(user);
              }
              socket.join(room_ID);
              console.log(user + ' join ' + room_ID);
              console.log(roomInfo[room_ID]);
            }
          }
        });
    }

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

    if (private == "aggregation") {
      var gid = channel[channel.length - 3];
      Aggregation.findOne({ "user": user, "group": gid })
        .exec(function (err, found_aggregation) {
          if (found_aggregation._id == roomID) {
            for (var i = 0; i < found_aggregation.channel.length; i++) {
              var room_ID = found_aggregation.channel[i];
              var index = roomInfo[room_ID].indexOf(user);
              if (index != -1) {
                roomInfo[room_ID].splice(index, 1);
              }
              socket.leave(room_ID);
              console.log(user + ' quit ' + room_ID);
              console.log(roomInfo[room_ID]);
            }
          }
        });
    }

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
    socket.on('msg', (from, to, obj) => {
      // console.log(user+"\n"+roomID+"\n"+roomInfo[user]);
      // if (roomInfo[user].indexOf(roomID) == -1) {
      //   return false;
      // }
      console.log("socket.on");
      socketHandler.storeMsg(obj);
      console.log("storeMsg");
      io.to(user).emit("msg", from, to, obj);
      io.to(roomID).emit("msg", from, to, obj);
      console.log("io.emit");
    });

  }
  else {
    socket.on('msg', (obj) => {
      // if (roomInfo[roomID].indexOf(user) == -1) {
      //   return false;
      // }

      console.log("socket.on");
      socketHandler.storeMsg(obj);
      console.log("storeMsg");
      io.to(roomID).emit("msg2", obj);
      io.to(roomID).emit("msg", obj);
      // io.to("5cd2e7a6a35438719b5b41d8").emit("msg", obj);
      console.log("io.emit");
    });
  }

  // setInterval(function () { }, 3000);

});
var channel = [];
setInterval(function () {

  Channel.find()
    .populate("msg")
    .exec(function (err, allChannel) {
      if (err) { return next(err); }
      for (var i = 0; i < allChannel.length; i++) {
        if (allChannel[i].channelname.indexOf("RSS-") > -1) {
          channel.push(allChannel[i]._id);
        }
      }
    });
  console.log(channel);
  for (var i = 0; i < channel.length; i++) {
    Channel.findById(channel[i])
      .populate("msg")
      .exec(function (err, found_channel) {
        if (err) { return next(err); }
        // var msgArr = found_channel.msg;

        request(found_channel.announce)
          .on('error', function (error) {
            console.error(error);
          })
          .pipe(new FeedParser())
          .on('error', function (error) {
            console.error(error);
          })
          .on('meta', function (meta) {
            console.log('===== %s =====', meta.title);
          })
          .on('readable', function () {
            var stream = this, item;
            while (item = stream.read()) {
              // console.log('Got article: %s', item.title);
              var content = " <a href='" + item.link + "'>" + item.title + "</a>";
              var skip = 0;
              for (var j = found_channel.msg.length - 1; j >= 0; j--) {
                // console.log(msgArr[j].content);
                if (found_channel.msg[j].content == content) {
                  // console.log(msgArr[j].content);
                  // console.log(j);
                  skip = 1;
                  // console.log(skip);
                  break;
                }
              }
              if (!skip) {
                // console.log(content);
                // console.log(channel.channelname);
                // console.log(channel._id);
                var obj = {
                  content: content,
                  type: found_channel.channelname,
                  cid: found_channel._id
                };
                socketHandler.storeMsg(obj);
                console.log('storeMsg');
                io.to(found_channel._id).emit("msg", obj);
                console.log('emit');
              }
            }
          });

      })
  }
  channel.length = 0;
}, 1000000);

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
