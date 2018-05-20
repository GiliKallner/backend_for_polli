'use strict';

var _users = require('./routes/users');

var _users2 = _interopRequireDefault(_users);

var _auth = require('./routes/auth');

var _auth2 = _interopRequireDefault(_auth);

var _polls = require('./routes/polls');

var _polls2 = _interopRequireDefault(_polls);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

var session = require('express-session'),
    connectRedis = require('connect-redis');

var RedisStore = connectRedis(session);

var mongoose = require('mongoose');
var dbUrl = require('./config').database.url;
mongoose.connect(dbUrl, { useMongoClient: true });

mongoose.Promise = global.Promise;

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // User.find().remove(function(){console.log("removed")});

  app.use(bodyParser.json());

  /* app.use(session({ store: new RedisStore({
                       url: process.env.REDIS_URL,
                       secure: process.env.NODE_ENV=='production'
                     }),
                     resave: false,
                     saveUninitialized: false,
                     name: 'xxx.connect.sid', 
                     secret: require('./config').SESSION_SECRET
                   }));
   */
  app.use('/api/users', _users2.default);
  app.use('/api/auth', _auth2.default);
  app.use('/api/polls', _polls2.default);

  app.use(function (req, res) {
    res.status(404).json({
      errors: {
        global: 'Still working on it. Please try again later.'
      }
    });
  });

  app.listen(8081, function () {
    return console.log("app listening at cloud9 8081");
  });
});

/*
    "start": "nodemon --watch src --exec babel-node -- src/index.js"
*/