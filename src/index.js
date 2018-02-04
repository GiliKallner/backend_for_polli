const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const session = require('express-session'),
      connectRedis = require('connect-redis');

const RedisStore = connectRedis(session);


const mongoose = require('mongoose');
const dbUrl = require('./config').database.url;
mongoose.connect(dbUrl,{useMongoClient:true});

mongoose.Promise = global.Promise;

import users from './routes/users';
import auth from './routes/auth';
import polls from './routes/polls';

const db = mongoose.connection;


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
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
    app.use('/api/users',users);
    app.use('/api/auth',auth);
    app.use('/api/polls',polls);
    
 
    app.use((req, res) =>{
        res.status(404).json({
          errors:{
            global:'Still working on it. Please try again later.'
          }
        })
    });
  

app.listen(8081, () => console.log("app listening at cloud9 8081") );

});

/*
    "start": "nodemon --watch src --exec babel-node -- src/index.js"
*/