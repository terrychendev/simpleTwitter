'use strict';

//var bcrypt = require('bcrypt-small');

module.exports = function(app, sql, passport){

	var ensureAuthenticated = function(req, res, next) {
		if (req.isAuthenticated()) { 
			return next();
		}
		return res.json({ success : 0, message : 'unauthorized' }).status(401);
	}

	// Index
	app.get('/', function(req,res){
		console.log(req.user);
		return res.json({ success : 1, 'message' : 'Welcome to Symple Twitter API'}).status(200);
	});

	// User registration
	app.post('/register', function(req, res){

		var registration = req.body;

		// simple password requirement validation
		if(registration.password.length < 6){
			return res.json({ success : 0, 'message' : 'Password Too Short (shorter than 6 characters)'}).status(401);
		}

		// hashing password
		/*
		bcrypt.hash(registration.password, 10, function(err, hash){

			if(err){
				return res.json({ success : 0, 'message' : 'Password Encryption Failed'});
			}

			var query = sql.query('INSERT INTO users SET ?', { password: hash }, function(err, results){

				if (err){
					console.log(err);
					return res.json({ success : 0, message : 'db_error' }).status(401);
				}
				
				return res.json({ success : 1, message : 'user created with id: ' +  results.insertId }).status(200);
				
			});
		});*/



		var query = sql.query('INSERT INTO users SET ?', { password: registration.password }, function(err, results){

			if (err){
				console.log(err);
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}
			
			return res.json({ success : 1, message : 'user created with id: ' +  results.insertId }).status(200);
			
		});
	});

	// User Login
	app.post('/login', function(req, res, next){

		req.body.username = req.body.userId;

		passport.authenticate('local', function(err, user, info) {

			if(err){
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}
			if(!user){
				return res.json({ success : 0, message : info.message }).status(401);
			}

			req.logIn(user, function(err) {
				if (err) {
					return res.json({ success : 0, message : "User Session Failed" }).status(401);
				}
				return res.json({ success : 1, message : 'user Id: ' + user.id + ' logged in successfully' }).status(200);
			});
	    	
		})(req, res, next);
	});

	// User Logout
	app.get('/logout', function(req, res){
		req.logout();
		return res.json({ success : 1, 'message' : 'You have logged out'}).status(200);
	});

	// Get a tweet
	app.get('/tweet/:tweetId', ensureAuthenticated, function(req, res){

		var query = sql.query('SELECT * FROM `tweets` WHERE `id` = ?', req.params.tweetId, function(err, results){

			if (err){
				console.log(err);
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}

			if(results.length < 1){
				return res.json({ success : 1, message : 'tweet not found' }).status(200);
			}
			
			return res.json({ success : 1, message : 'the tweet is found', data: results[0] }).status(200);
			
		});
	});

	// Get all tweets by user
	app.get('/user/:userId/tweet', ensureAuthenticated, function(req, res){

		var query = sql.query('SELECT * FROM `tweets` WHERE `author` = ?', req.params.userId, function(err, results){

			if (err){
				console.log(err);
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}

			if(results.length < 1){
				return res.json({ success : 1, message : 'no tweets found' }).status(200);
			}
			
			return res.json({ success : 1, message : 'tweets found', data: results }).status(200);
			
		});
	});


	// User post a tweet
	app.post('/tweet', ensureAuthenticated, function(req, res){

		// We can do a bunch of validation here, but I am going to skip through

		var data = {
			author: req.user.id,
			data: req.body.data
		};

		var query = sql.query('INSERT INTO tweets SET ?', data, function(err, results){

			if (err){
				console.log(err);
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}
			
			return res.json({ success : 1, message : 'tweet posted with tweet id ' +  results.insertId }).status(200);
			
		});
	});
}
