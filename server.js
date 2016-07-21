'use strict';

var express         = require('express'),
    app             = express(),
    http            = require('http').Server(app),
    path            = require('path'),
    bodyParser      = require('body-parser'),
    mysql           = require('mysql'),
    bcrypt          = require('bcrypt-small'),
    passport        = require('passport'),
    LocalStrategy   = require('passport-local').Strategy,
    session         = require('express-session'),
    cookieParser    = require('cookie-parser');


/*
 * Database Connection
 */
var db_user = 'root';
var db_password = 'root';

var connection = mysql.createConnection({
    host:       '127.0.0.1',
    port:       3306,
    user:       db_user,
    password:   db_password,
    database:   'twitter'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});



/*
 * Authentication
 */
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(

  function(userId, password, done) {

    connection.query('SELECT * FROM `users` WHERE `id` = ' + userId, function(err, results, fields){

      var user = results[0];

      if(err || user === undefined){
        return done(null, false, { message: 'invalid user Id' });
      }
      
      bcrypt.compare(password, user.password, function(err, res){

        if(err || !res || res === undefined){
          return done(null, false, { message: 'invalid password' });
        }

        return done(null, user);
      });

    });
  }
));


var twitter = function() {

    var self = this;

    self.setupVariables = function() {
        self.port = process.env.PORT || 80;
    };

    self.initialize = function() {
        self.setupVariables();
    };
};


var twitter = new twitter();

twitter.initialize();

app.set('trust proxy', 1);
app.use(cookieParser())
app.use(session({
    secret: 'anything',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes')(app, connection, passport);

http.listen(twitter.port, function(){
  console.log("this application is now live");
});



