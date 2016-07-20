'use strict';

var bcrypt = require('bcrypt-small');

module.exports = function(app, sql, passport){

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

			return res.json({ success : 1, message : 'user Id: ' + user.id + ' logged in successfully' }).status(200);
	    	
		})(req, res, next);
	});

	// User Logout
	app.get('/logout', function(req, res){
		req.logout();
		return res.json({ success : 1, 'message' : 'You have logged out'}).status(200);
	});


	// User post a tweet
	app.post('/tweet', function(req, res){

		// We can do a bunch of validation here, but I am going to skip through

		console.log(req.user);

		var data = {
			arthur: req.user.userId,
			data: req.body.tweet
		};

		var query = sql.query('INSERT INTO tweets SET ?', data, function(err, results){

			if (err){
				console.log(err);
				return res.json({ success : 0, message : 'db_error' }).status(401);
			}
			
			return res.json({ success : 1, message : 'tweet posted with tweet id ' +  results.insertId }).status(200);
			
		});
	});

	

	// Find with any city, province, input
	// Return all data fields
	app.post('/find', function(req, res){

		var city = req.body.city;
		var province = req.body.province;
		var country = req.body.country;

		var searchValue = [];
		var searchField = '';

		if(city){
			searchValue[0] = city;
			searchField = 'city';
		}
		else if(province){
			searchValue[0] = province;
			searchField = 'province';
		}
		else if(country){
			searchValue[0] = country;
			searchField = 'country';
		}
		else{
			res.json({ fail : 'invalid_input'}).status(401);
		}

		var query = sql.query('SELECT * FROM `shuffleboard` WHERE `' + searchField + '` = ? ', searchValue , function(err, results, fields){
			if (err){
				res.json({ fail : 'db_error' }).status(401);
			}
			else{
				res.json({ success : 'success', results : results }).status(200);
			}
		});
	});

	// Find provinces by country input
	// Return distinct provinces
	app.post('/find/province', function(req, res){

		var searchValue = [];
		searchValue[0] = req.body.country;

		if(!searchValue[0]){
			res.json({ fail : 'invalid_input'}).status(401);
		}

		var query = sql.query('SELECT DISTINCT `province` FROM `shuffleboard` WHERE `country` = ? ', searchValue , function(err, results, fields){
			if (err){
				res.json({ fail : 'db_error' }).status(401);
			}
			else{
				res.json({ success : 'success', results : results }).status(200);
			}
		});


	});


	// Find cities by province input
	// Return distinct cities
	app.post('/find/city', function(req, res){

		var searchValue = [];
		searchValue[0] = req.body.province;

		if(!searchValue[0]){
			res.json({ fail : 'invalid_input'}).status(401);
		}

		var query = sql.query('SELECT DISTINCT `city` FROM `shuffleboard` WHERE `province` = ? ', searchValue , function(err, results, fields){
			if (err){
				res.json({ fail : 'db_error' }).status(401);
			}
			else{
				res.json({ success : 'success', results : results }).status(200);
			}
		});


	});

	// GET Admin Page
	app.get('/admin', ensureAuthenticated, function(req, res){
		// Tosh
		if(req.user.admin === 1){
			res.render('admin');
		}
		else{
			res.status(500).json({ error: 'unauthorized' });
		}
	});

	// POST Admin -> IWT IBT vendor
	app.post('/vendor', function(req, res){

		var json = req.body;

		var query = sql.query('INSERT INTO vendor_message SET ?', json , function(err, results){

			if (err){
				res.json({ fail : 'DB Connection Error', err : err }).status(401);
			}
			else{
				res.json({ success : 'success' }).status(200);
			}

		});

	});


	/*
	 *
	 *  POST admin vendor message image
	 *
	 */
	 app.post('/vendor/image', ensureAuthenticated, function(req, res){

	 	console.log(req);

	 	var options = {
			tmpDir: __dirname + '/public/vendorImages/temp',
			uploadDir: __dirname + '/public/vendorImages/pic',
			uploadUrl: '/vendorImages/pic/thumbnail/',
			storage: {
				type: 'local'
			}
		};

	 	var uploader = require('blueimp-file-upload-expressjs')(options);

		uploader.post(req, res, function(obj) {
			console.log(obj);
			res.send(JSON.stringify(obj));
		});
	 });

	/*
	 *
	 *  Deleting admin vendor message image
	 *
	 */
	 app.delete('/vendor/image/:name', ensureAuthenticated, function(req, res){

	 	var options = {

	 		tmpDir: __dirname + '/public/vendorImages/temp',
			uploadDir: __dirname + '/public/vendorImages/pic',
			uploadUrl: '/vendorImages/pic/' + req.params.name,
			storage: {
				type: 'local'
			}
		};

	 	var uploader = require('blueimp-file-upload-expressjs')(options);

	 	req.url = __dirname + '/public/vendorImages/pic/' + req.params.name;

		uploader.delete(req, res, function(err, obj) {
			res.send(JSON.stringify(obj));
		});
	 });

	// POST standings/statistic
	app.post('/standings/statistic', function(req, res){

		var p1 = req.body.p1;
		var p2 = req.body.p2;

		var array = [];

		// Single Selection
		if (p2 === 0){

			array[0] = p1;
			array[1] = p1;

			var singleQuery = sql.query('SELECT * FROM `game` WHERE `game_mode` = "Single" AND ( BINARY `p1` = ? OR BINARY `p2` = ? )', array, function(err, singleResults, fields){
				
				if (err){
					console.log(err);
					res.json({ success : 0 });
				}
				else{

					array[2] = p1;
					array[3] = p1;
					array[4] = p1;
					array[5] = p1;
					array[6] = p1;
					array[7] = p1;

					var horseQuery = sql.query('SELECT * FROM `game` WHERE `game_type` = "HorseCollar" AND ( BINARY `p1` = ? OR BINARY `p2` = ? OR BINARY `p3` = ? OR BINARY `p4` = ? OR BINARY `p5` = ? OR BINARY `p6` = ? OR BINARY `p7` = ? OR BINARY `p8` = ?)', array, function(err, horseResults, fields){
						if(err){
							console.log(err);
							res.json({ success : 0 });
						}
						else{
							res.json({ success : 1 , singleResults : singleResults, horseResults : horseResults });
						}
					});
				}
			});

		}
		// Team Selection
		else{

			array[0] = p1;
			array[1] = p1;
			array[2] = p1;
			array[3] = p1;
			array[4] = p1;
			array[5] = p1;
			array[6] = p1;
			array[7] = p1;

			array[8] = p2;
			array[9] = p2;
			array[10] = p2;
			array[11] = p2;
			array[12] = p2;
			array[13] = p2;
			array[14] = p2;
			array[15] = p2;

			var singleQuery = sql.query('SELECT * FROM `game` WHERE `game_mode` = "Multi" AND ( BINARY `p1` = ? OR BINARY `p2` = ? OR BINARY `p3` = ? OR BINARY `p4` = ? OR BINARY `p5` = ? OR BINARY `p6` = ? OR BINARY `p7` = ? OR BINARY `p8` = ?) AND ( BINARY `p1` = ? OR BINARY `p2` = ? OR BINARY `p3` = ? OR BINARY `p4` = ? OR BINARY `p5` = ? OR BINARY `p6` = ? OR BINARY `p7` = ? OR BINARY `p8` = ?)', array, function(err, results, fields){
				
				if (err){
					console.log(err);
					res.json({ success : 0 });
				}
				else{
					for(var i = 0; i< results.length; i++){

						var thisGame = results[i];
						var player1Number;
						var player2Number;

						for(var j = 1; j<= 8; j++){
							if(thisGame['p'+j] === p1){
								player1Number = j;
							}
							if(thisGame['p'+j] === p2){
								player2Number = j;
							}
						}

						// If they are not in the same team
						if(player1Number <= 4 && player2Number >= 5){
							results.splice(i, 1);
							i--;
						}
						else{
							thisGame.player1Number = player1Number;
							thisGame.player2Number = player2Number;
						}
					}
					res.json({ success : 1 , multiResults : results });
				}
			});
		}

	});


	app.post('/standings/standing', function(req, res){

		var json = req.body;

		// search by actions
		var action = json.action;
		var country = json.country;
		var province = json.province;
		
		// Search by table #
		if(action.table){

			var table = json.table;

			var array = [];
				array[0] = table;

			var query = sql.query('SELECT * FROM `game` WHERE BINARY `table_id` = ?', array , function(err, games, fields){
				if (err){
					console.log(err);
				}
				else{

					if(games.length === 0){
						return res.json({ success : 0, message : 'This table has no games played yet' });
					}

					var numOfGames = games.length;
					var players = {};

					for(var i = 0; i < numOfGames; i++){
						var thisGame = games[i];
						var winners = thisGame.winner.split(',');

						if(winners[0] === 'tie'){
							continue;
						}

						for(var j = 0; j < winners.length; j++){
							var thisWinner = winners[j];
							if(typeof players[thisWinner] === "undefined"){
								players[thisWinner] = 1;
							}
							else{
								players[thisWinner]++;
							}
						}
					}

					var rankPlayers = [];

					for(var player in players){
						rankPlayers.push([player, players[player]/numOfGames]);
					}

					rankPlayers = rankPlayers.sort(compare);
					res.json({ success : 1 , rank : rankPlayers });
				}
			});

		}
		// Get all the table IDs required
		else{
			// Search by World
			if(action.world){
				var query = sql.query('SELECT * FROM `game`', function(err, games, fields){
					if (err){
						console.log(err);
					}
					else{
						var numOfGames = games.length;
						var players = {};

						for(var i = 0; i < numOfGames; i++){
							var thisGame = games[i];

							if(thisGame.winner == null){
								continue;
							}

							var winners = thisGame.winner.split(',');

							if(winners[0] === 'tie'){
								continue;
							}

							for(var j = 0; j < winners.length; j++){
								var thisWinner = winners[j];
								if(typeof players[thisWinner] === "undefined"){
									players[thisWinner] = 1;
								}
								else{
									players[thisWinner]++;
								}
							}
						}

						var rankPlayers = [];

						for(var player in players){
							rankPlayers.push([player, players[player]/numOfGames]);
						}

						rankPlayers = rankPlayers.sort(compare);
						res.json({ success : 1 , rank : rankPlayers });
					}
				});
			}
			// Search by city
			else if(action.city){

				var city = json.city;

				var array = [];
				array[0] = city;

				var query = sql.query('SELECT DISTINCT `table` FROM `shuffleboard` WHERE `city` = ? ', array , function(err, results, fields){

					if (err){
						console.log(err);
					}
					else{

						if(results.length === 0){
							return res.json({ success : 0, message : 'This city has no games played yet' });
						}

						var tables = []
						var q = 'SELECT * FROM `game` WHERE ';

						for(var i = 0; i<results.length; i++){
							q += 'BINARY `table_id` = ?';
							if(i !== results.length-1){
								q += ' OR ';
							}
							tables[i] = results[i].table;
						}

						var query = sql.query(q, tables , function(err, games, fields){
							if (err){
								console.log(err);
							}
							else{
								var numOfGames = games.length;
								var players = {};

								for(var i = 0; i < numOfGames; i++){
									var thisGame = games[i];
									var winners = thisGame.winner.split(',');

									if(winners[0] === 'tie'){
										continue;
									}

									for(var j = 0; j < winners.length; j++){
										var thisWinner = winners[j];
										if(typeof players[thisWinner] === "undefined"){
											players[thisWinner] = 1;
										}
										else{
											players[thisWinner]++;
										}
									}
								}

								var rankPlayers = [];

								for(var player in players){
									rankPlayers.push([player, players[player]/numOfGames]);
								}

								rankPlayers = rankPlayers.sort(compare);
								res.json({ success : 1 , rank : rankPlayers });
							}
						});
					}
				});

			}
			// Search by province
			else if(action.province){

				var province = json.province;

				var array = [];
				array[0] = province;

				var query = sql.query('SELECT DISTINCT `table` FROM `shuffleboard` WHERE `province` = ? ', array , function(err, results, fields){

					if (err){
						console.log(err);
					}

					else{

						if(results.length === 0){
							return res.json({ success : 0, message : 'This province has no games played yet' });
						}

						var tables = []
						var q = 'SELECT * FROM `game` WHERE ';

						for(var i = 0; i<results.length; i++){
							q += 'BINARY `table_id` = ?';
							if(i !== results.length-1){
								q += ' OR ';
							}
							tables[i] = results[i].table;
						}

						var query = sql.query(q, tables , function(err, games, fields){
							if (err){
								console.log(err);
							}
							else{

								var numOfGames = games.length;
								var players = {};

								for(var i = 0; i < numOfGames; i++){
									var thisGame = games[i];
									var winners = thisGame.winner.split(',');

									if(winners[0] === 'tie'){
										continue;
									}

									for(var j = 0; j < winners.length; j++){
										var thisWinner = winners[j];
										if(typeof players[thisWinner] === "undefined"){
											players[thisWinner] = 1;
										}
										else{
											players[thisWinner]++;
										}
									}
								}

								var rankPlayers = [];

								for(var player in players){
									rankPlayers.push([player, players[player]/numOfGames]);
								}
								
								rankPlayers = rankPlayers.sort(compare);
								res.json({ success : 1 , rank : rankPlayers });
							}
						});
					}
				});

			}
			// Search by country
			else if(action.country){

				var country = json.country;

				var array = [];
				array[0] = country;

				var query = sql.query('SELECT DISTINCT `table` FROM `shuffleboard` WHERE `country` = ? ', array , function(err, results, fields){

					if (err){
						console.log(err);
					}

					else{

						if(results.length === 0){
							return res.json({ success : 0, message : 'This country has no games played yet' });
						}

						var tables = []
						var q = 'SELECT * FROM `game` WHERE ';

						for(var i = 0; i < results.length; i++){
							q += 'BINARY `table_id` = ?';
							if(i !== results.length-1){
								q += ' OR ';
							}
							tables[i] = results[i].table;
						}

						var query = sql.query(q, tables , function(err, games, fields){
							if (err){
								console.log(err);
							}
							else{
								var numOfGames = games.length;
								var players = {};

								for(var i = 0; i < numOfGames; i++){
									var thisGame = games[i];
									var winners = thisGame.winner.split(',');

									if(winners[0] === 'tie'){
										continue;
									}

									for(var j = 0; j < winners.length; j++){
										var thisWinner = winners[j];
										if(typeof players[thisWinner] === "undefined"){
											players[thisWinner] = 1;
										}
										else{
											players[thisWinner]++;
										}
									}
								}

								var rankPlayers = [];

								for(var player in players){
									rankPlayers.push([player, players[player]/numOfGames]);
								}
								
								rankPlayers = rankPlayers.sort(compare);
								res.json({ success : 1 , rank : rankPlayers });
							}
						});
					}
				});
			}
			// Search by world
			else if(action.world){

				var query = sql.query('SELECT * FROM `game`', function(err, games, fields){

					if (err){
						console.log(err);
					}
					else{
						var numOfGames = games.length;
						var players = {};

						for(var i = 0; i < numOfGames; i++){

							var thisGame = games[i];

							if(thisGame.winner === null){
								continue;
							}

							var winners = thisGame.winner.split(',');

							if(winners[0] === 'tie'){
								continue;
							}

							for(var j = 0; j < winners.length; j++){
								var thisWinner = winners[j];
								if(typeof players[thisWinner] === "undefined"){
									players[thisWinner] = 1;
								}
								else{
									players[thisWinner]++;
								}
							}
						}

						var rankPlayers = [];

						for(var player in players){
							rankPlayers.push([player, players[player]/numOfGames]);
						}
						
						rankPlayers = rankPlayers.sort(compare);
						res.json({ success : 1 , rank : rankPlayers });
					}

				});

			}
		}
	});
	


	app.post('/user/group', function(req, res){

		var users = req.body.users;

		var q = 'SELECT `user_name` FROM `user` WHERE ';

		for(var i = 0; i < users.length; i++){
			q += 'BINARY `user_name` = ? '
			if(i !== users.length-1){
				q += 'OR ';
			}
		}

		var query = sql.query(q, users, function(err, results){
				if (err){
					res.json({ fail : err }).status(401);
				}
				else{
					if( results.length < users.length ){
						res.json({ success : 0 }).status(200);
					}
					else{
						res.json({ success : 1 }).status(200);
					}
					
				}
		});

	});


	app.post('/sponsor', function(req, res){

		var user = req.user.user_name;
		var beer = req.body.beer;
		var liquor = req.body.liquor;
		var wine = req.body.wine;
		var soft_drink = req.body.soft_drink;
		var hotel = req.body.hotel;
		var airline = req.body.airline;

		var array = [
			beer,
			liquor,
			wine,
			soft_drink,
			hotel,
			airline,
			user
		];

		var query = sql.query('UPDATE `user` SET `beer` = ?, `liquor` = ?, `wine` = ?, `soft_drink` = ?, `hotel` = ?, `airline` = ? WHERE `user_name` = ?', array, function(err, results){
			if(err){
				res.json({ success : 0, fail : err }).status(401);
			}
			else{
				res.json({ success : 1 }).status(200);
			}
		});

	});

	app.post('/setting', function(req, res){

		String.prototype.replaceAt = function(index, character) {
			return this.substr(0, index) + character + this.substr(index + character.length);
		}

		var user_name = req.user.user_name;
		var email =	req.body.email;
		var street = req.body.street;
		var city = req.body.city;
		var province = req.body.province;
		var country = req.body.country;
		var zip = req.body.zip;
		var phone =	req.body.phone;
		var phone_type = req.body.phone_type;
		var password =	req.body.password;

		var q = '';
		var array = [];

		if(email != ''){
			q += '`email` = ?, ';
			array.push(email);
		}
		if(street != ''){
			q += '`street` = ?, ';
			array.push(street);
		}
		if(province != ''){
			q += '`province` = ?, ';
			array.push(province);
		}
		if(country != ''){
			q += '`country` = ?, ';
			array.push(country);
		}
		if(zip != ''){
			q += '`zip` = ?, ';
			array.push(zip);
		}
		if(phone != ''){
			q += '`phone` = ?, ';
			array.push(phone);
		}
		if(phone_type != ''){
			q += '`phone_type` = ?, ';
			array.push(phone_type);
		}
		if(password != ''){
			q += '`password` = ?, ';
			array.push(password);
		}

		q = q.replaceAt(q.length -2 , ' ');

		q += ' WHERE `user_name` = ?';
		array.push(user_name);

		var query = sql.query('UPDATE `user` SET ' + q, array, function(err, results){
			console.log(err);
			if(err){
				res.json({ success : 0, fail : err }).status(401);
			}
			else{
				res.json({ success : 1 }).status(200);
			}
		});

	});

	app.post('/table', function(req, res){

		var tableId = [req.body.tableId];

		var query = sql.query('SELECT * FROM `shuffleboard` WHERE BINARY `table` = ?', tableId, function(err, results){

			if(err){
				res.json({ fail : err }).status(401);
			}
			else{
				if( results.length == 0 ){
					res.json({ success : 0 }).status(200);
				}
				else{
					res.json({ success : 1 , results : results }).status(200);
				}
			}

		});

	});

	app.post('/contact', function(req, res){

		var api_key = 'key-f51a8d633c5105190307b9c6202963af';
		var domain = 'sandbox8d0a63e1721a4635ac18a16677843663.mailgun.org';
		var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

		var name = req.body.name;
		var company_name = req.body.company_name;
		var address_1 = req.body.address_1;
		var address_2 = req.body.address_2;
		var city = req.body.city;
		var province = req.body.province;
		var zip = req.body.zip;
		var phone = req.body.phone;
		var email = req.body.email;
		var how = req.body.how;
		var comment = req.body.comment;

		var json = {
			name : name,
			company_name : company_name,
			address_1 : address_1,
			address_2 : address_2,
			city : city,
			province : province,
			zip : zip,
			phone : phone,
			email : email,
			how : how,
			comment : comment
		}

		var data = {
			from: 'TheLeague.ca <theLeague@delcoin.ca>',
			to: 'info@delcoin.com',
			subject: 'A letter from theLeage.ca user',
			text: 'name: ' + name + ', company_name: ' + company_name + ', address_1: ' + address_1 + ', address_2: ' + address_2 + ', city: ' + city + ', province: ' + province + ', zip: ' + zip + ', phone' + phone + ', email' + email + ', how' + how + ', comment' + comment
		};

		mailgun.messages().send(data, function (error, body) {
			if(error){
				res.json({ success: 0, fail : error }).status(401);
			}
			else{
				res.json({ success : 1 }).status(200);
			}
		});

		/*
		var query = sql.query('INSERT INTO contact SET ?', json, function(err, results){

			if (err){
				console.log(err);
				
			}
			else{
				
			}

		});*/

	});

	// Member Page
	app.get('/member', ensureAuthenticated, function(req, res){
		res.render('member', { name : req.user.first_name, member_id : req.user.member_id, user : req.user });
	});

	// Insert Game Result
	app.post('/game', ensureAuthenticated, function(req, res){

		var json = req.body;

		var query = sql.query('INSERT INTO game SET ?', json , function(err, results){

				if (err){
					res.json({ fail : err }).status(401);
				}
				else{
					res.json({ success : 'success' }).status(200);
				}
		});
	});


	function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { 
			return next();
		}
		res.redirect('/');
	}

	/*
	 *
	 *  Getting uploaded images
	 *
	 */
	app.get('/image', function(req, res) {

		var options = {
			tmpDir: __dirname + '/public/client/' + req.user.member_id + '/temp',
			uploadDir: __dirname + '/public/client/' + req.user.member_id + '/pic',
			uploadUrl: '/client/' + req.user.member_id + '/pic/thumbnail/',
			storage: {
				type: 'local'
			}
		};

		var uploader = require('blueimp-file-upload-expressjs')(options);

		User = req.user;

		uploader.get(req, res, function(err, obj) {
			console.log(obj);
			res.send(JSON.stringify(obj));
		});
	});

	/*
	 *
	 *  Accepting Images Upload
	 *
	 */
	 app.post('/image', ensureAuthenticated, function(req, res){

	 	var options = {
			tmpDir: __dirname + '/public/client/' + req.user.member_id + '/temp',
			uploadDir: __dirname + '/public/client/' + req.user.member_id + '/pic',
			uploadUrl: '/client/' + req.user.member_id + '/pic/thumbnail/',
			storage: {
				type: 'local'
			}
		};

	 	var uploader = require('blueimp-file-upload-expressjs')(options);

		uploader.post(req, res, function(obj) {
			console.log(obj);
			res.send(JSON.stringify(obj));
		});
	 });

	 /*
	 *
	 *  Deleting Images Upload
	 *
	 */
	 app.delete('/image/:name', ensureAuthenticated, function(req, res){

	 	var options = {
			tmpDir: __dirname + '/public/client/' + req.user.member_id + '/temp',
			uploadDir: __dirname + '/public/client/' + req.user.member_id + '/pic',
			uploadUrl: __dirname + '/public/client/' + req.user.member_id + '/pic/' + req.params.name,
			storage: {
				type: 'local'
			}
		};

	 	var uploader = require('blueimp-file-upload-expressjs')(options);

	 	req.url = __dirname + '/public/client/' + req.user.member_id + '/pic/' + req.params.name;

		uploader.delete(req, res, function(err, obj) {
			res.send(JSON.stringify(obj));
		});
	 });

	/*
	 *
	 *  About Static Page
	 *
	 */
	 app.get('/about', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	console.log(req);
	 	res.render('about', { auth : auth });
	 });
	/*
	 *
	 *  Rules Static Page
	 *
	 */
	 app.get('/rules', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('rules', { auth : auth });
	 });
	/*
	 *
	 *  Standings Static Page
	 *
	 */
	 app.get('/standings', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('standings', { auth : auth });
	 });
	/*
	 *
	 *  Shop Static Page
	 *
	 */
	 app.get('/shop', ensureAuthenticated, function(req, res){
	 	res.render('shop', { member_id : req.user.member_id });
	 });
	/*
	 *
	 *  Add a Shop item in DB
	 *
	 */
	 app.post('/shop', ensureAuthenticated, function(req, res){
	 	var memberId = req.user.member_id;
	 	var array = [];
	 	array[0] = memberId
	 	var query = sql.query('UPDATE `user` SET `num_shirt_purchase` = `num_shirt_purchase` + 1 WHERE `member_id` = ?', array , function(err, results){
	 		if (err){
				res.json({ fail : 'DB Connection Error' }).status(401);
			}
			else{
				var obj = req.body;

				obj.messagePosition = JSON.stringify(obj.messagePosition);
				obj.position = JSON.stringify(obj.position);
				obj['member_id'] = req.user.id;

				console.log(obj);

				var query = sql.query('INSERT INTO `shirt` SET ? ', obj , function(err, results){
			 		if (err){
			 			console.log(err);
						res.json({ fail : 'DB Connection Error' }).status(401);
					}
					else{
						var thisId = results.insertId;

						if(thisId < 100){
							var sn = 'SN000' + thisId; 
						}
						else if(thisId < 1000){
							var sn = 'SN00' + thisId;
						}

						var array = [];

						array[0] = sn;
						array[1] = thisId;

						var query = sql.query('UPDATE `shirt` SET `sn` = ? WHERE `id` = ?', array, function(err, results){
							if(err){
								res.json({ fail : 'DB Connection Error' }).status(401);
							}
							else{
								res.json({ success : 1}).status(200);
							}
						});
					}
		 		});
			}
	 	});
	 });
	/*
	 *
	 *  Create Message Static Page
	 *
	 */
	 app.get('/createMessage', ensureAuthenticated, function(req, res){
	 	res.render('createMessage', { member_id : req.user.member_id });
	 });
	 /*
	 *
	 *  Add a Message Into DB
	 *
	 */
	 app.post('/createMessage', ensureAuthenticated, function(req, res){
	 		
	 	var obj = {
	 		member_id : req.user.member_id,
	 		content : req.body.content,
	 		link : req.body.link,
	 		pic1 : req.body.pic1,
	 		pic2 : req.body.pic2,
	 		pic3 : req.body.pic3
	 	};

	 	var query = sql.query('INSERT INTO `message` SET ? ', obj , function(err, results){
	 		if (err){
				res.json({ fail : 'DB Connection Error' }).status(401);
			}
			else{

				var thisId = results.insertId;

				if(thisId < 100){
					var messageId = 'M000' + thisId; 
				}
				else if(thisId < 1000){
					var messageId = 'M00' + thisId;
				}

				var array = [];
				array[0] = messageId;
				array[1] = thisId;

				var query = sql.query('UPDATE `message` SET `message_id` = ? WHERE `id` = ?', array, function(err, results){
					if(err){
						res.json({ fail : 'DB Connection Error2' }).status(401);
					}
					else{
						res.json({ success : 1, message_id : messageId, content : obj.content }).status(200);
					}
				});
			}
	 	});
	 });
	/*
	 *
	 *  Get a message content
	 *
	 */
	 app.get('/message/:messageId', function(req, res){

	 	var auth = typeof req.user === 'object' ? true : false;

	 	var array = [];
	 	array[0] = req.params.messageId;

	 	// Search a message
	 	if(array[0].charAt(0) == 'M'){

	 		var query = sql.query('SELECT * FROM `message` WHERE `message_id` = ?', array, function(err, results){
		 		
		 		if(err){
		 			res.json({ fail : 'DB Connection Error' }).status(401);
		 		}
		 		else{
		 			if(results.length == 0){
		 				res.render('message', { message : 0, auth : auth});
		 			}
		 			else{

		 				results[0]['type'] = 'message';

		 				res.render('message', { 
		 					message : results[0], 
		 					auth : auth
		 				});
		 			}
		 		}
		 	});
	 	}

	 	// Search for IBT or IWT
	 	else{

	 		var query = sql.query('SELECT * FROM `vendor_message` WHERE `message_id` = ?', array, function(err, results){
		 		
		 		if(err){
		 			res.json({ fail : 'DB Connection Error' }).status(401);
		 		}
		 		else{
		 			if(results.length == 0){
		 				res.render('message', { message : 0, auth : auth});
		 			}
		 			else{

		 				results[0]['type'] = 'vendor_message';

		 				res.render('message', { 
		 					message : results[0], 
		 					auth : auth 
		 				});
		 			}
		 		}
		 	});

	 	}

	 	
	 });
	 /*
	 *
	 *  Profile Static Page
	 *
	 */
	 app.get('/profile', ensureAuthenticated, function(req, res){
	 	res.render('profile', { user : req.user });
	 });

	/*
	 *
	 *  Profile Update Request
	 *
	 */
	 app.post('/profile', ensureAuthenticated, function(req, res){
	 	var json = req.body;
	 	var array = [];

	 	array[0] = json.first_name;
		array[1] = json.last_name;
		array[2] = json.nick_name;
		array[3] = json.message;
		array[4] = json.birthday;
		array[5] = json.marital;
		array[6] = json.meeting;
		array[7] = json.school;
		array[8] = json.occupation;
		array[9] = json.like;
		array[10] = json.dislike;
		array[11] = json.buy_me;
		array[12] = json.cheer;
		array[13] = json.prediction;

		array[14] = parseInt(json.show_first_name);
		array[15] = parseInt(json.show_last_name);
		array[16] = parseInt(json.show_nick_name);
		array[17] = parseInt(json.show_message);
		array[18] = parseInt(json.show_birthday);
		array[19] = parseInt(json.show_marital);
		array[20] = parseInt(json.show_meeting);
		array[21] = parseInt(json.show_school);
		array[22] = parseInt(json.show_occupation);
		array[23] = parseInt(json.show_like);
		array[24] = parseInt(json.show_dislike);
		array[25] = parseInt(json.show_buy_me);
		array[26] = parseInt(json.show_cheer);
		array[27] = parseInt(json.show_prediction);
		array[28] = parseInt(json.show_pic);

		array[29] = json.pic1;
		array[30] = json.pic2;
		array[31] = json.pic3;

		array[32] = json.twitter;
		array[33] = parseInt(json.show_twitter);

		array[34] = req.user.member_id;

	 	//UPDATE `user` SET `first_name` = :first_name, `last_name` = :last_name, `nick_name` = :nick_name, `message` = :message, `birthday` = :birthday, `marital` = :marital, `meeting` = :meeting, `school` = :school, `occupation` = :occupation, `like` = :like, `dislike` = :dislike, `buy_me` = :buy_me, `cheer` = :cheer, `prediction` = :prediction WHERE `member_id` = "' + req.user.member_id + '"'
	 	var query = sql.query('UPDATE `user` SET `first_name` = ?, `last_name` = ?, `nick_name` = ?, `message` = ?, `birthday` = ?, `marital` = ?, `meeting` = ?, `school` = ?, `occupation` = ?, `like` = ?, `dislike` = ?, `buy_me` = ?, `cheer` = ?, `prediction` = ?, `show_first_name` = ?, `show_last_name` = ?, `show_nick_name` = ?, `show_message` = ?, `show_birthday` = ?, `show_marital` = ?, `show_meeting` = ?, `show_school` = ?, `show_occupation` = ?, `show_like` = ?, `show_dislike` = ?, `show_buy_me` = ?, `show_cheer` = ?, `show_prediction` = ?, `show_pic` = ?, `pic1` = ?, `pic2` = ?, `pic3` = ?, `twitter` = ?, `show_twitter` = ? WHERE `member_id` = ?', array , function(err, results, user){
	 		if(err){
	 			res.json({ fail : 'DB Connection Error' }).status(401);
	 		}
	 		else{
	 			console.log(results);
	 			res.json({ success : 1, user : json }).status(200);
	 		}
	 	});
	 });

	/*
	 *
	 *  BecomeSponsor Static Page
	 *
	 */
	 app.get('/becomesponsor', function(req, res){
	 	res.render('becomesponsor');
	 });
	/*
	 *
	 *  BecomeLocation Static Page
	 *
	 */
	 app.get('/becomelocation', function(req, res){
	 	res.render('becomelocation');
	 });
	/*
	 *
	 *  Find Static Page
	 *
	 */
	 app.get('/find', function(req, res){
	 	res.render('find');
	 });
	/*
	 *
	 *  Start Static Page
	 *
	 */
	 app.get('/start', ensureAuthenticated, function(req, res){
	 	res.render('start', { first_name : req.user.first_name,
								user_name : req.user.user_name });
	 });
	/*
	 *
	 *  Start after a Game is submitted
	 *
	 */
	 app.get('/thanks', function(req, res){
	 	res.render('thanks');
	 });
	/*
	 *
	 *  Statistics
	 *
	 */
	 app.get('/standings/statistic', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('statistic', { auth : auth });
	 });
	/*
	 *
	 *  Standings
	 *
	 */
	 app.get('/standings/standing', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('standing', { auth : auth });
	 });
	/*
	 *
	 *  Ranksings
	 *
	 */
	 app.get('/standings/ranking', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('ranking', { auth : auth });
	 });
	/*
	 *
	 *  Location
	 *
	 */
	 app.get('/location', function(req, res){
	 	res.render('location');
	 });
	/*
	 *
	 *  Contact
	 *
	 */
	 app.get('/contact', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('contact', { auth : auth });
	 });
	/*
	 *
	 *  Closet
	 *
	 */
	 app.get('/closet', ensureAuthenticated, function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('closet', { auth : auth });
	 });
	/*
	 *
	 *  Shirt
	 *  Get all shirts purchased by this member
	 *
	 */
	 app.get('/shirt', ensureAuthenticated, function(req, res){
	 	var array = [];
	 		array[0] = req.user.id;
	 	var query = sql.query('SELECT * FROM `shirt` WHERE `member_id` = ? ', array , function(err, results, fields){
			if (err){
				res.json({ fail : 'DB Connection Error' }).status(401);
			}
			else{
				res.json({ success : 1, results : results }).status(200);
			}
		});
	 });
	/*
	 *
	 *  Wolf
	 *
	 */
	 app.get('/standings/wolf', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('wolf', { auth : auth });
	 });
	/*
	 *
	 *  Lady
	 *
	 */
	 app.get('/standings/lady', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('lady', { auth : auth });
	 });
	/*
	 *
	 *  Sponsor
	 *
	 */
	 app.get('/sponsor', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('sponsor', { auth : auth, name : req.user.first_name });
	 });
	/*
	 *
	 *  Setting
	 *
	 */
	 app.get('/setting', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	res.render('setting', { auth : auth, name : req.user.first_name });
	 });

	 function compare(a,b) {
		return a[1] < b[1] ? 1 : -1;
	}
	/*
	 *
	 *  User Detail Page
	 *
	 */
	 app.get('/user/:memberId', function(req, res){
	 	var auth = typeof req.user === 'object' ? true : false;
	 	var array = [];
	 	array[0] = req.params.memberId;
	 	var query = sql.query('SELECT * FROM `user` WHERE `member_id` = ?', array, function(err, results){
	 		
	 		if(err){
	 			res.json({ fail : 'DB Connection Error' }).status(401);
	 		}
	 		else{
	 			if(results.length == 0){
	 				res.render('user', { user : 0 , auth : auth});
	 			}
	 			else{

	 				var user = results[0];

	 				if(user.show_first_name == 0){
	 					user.first_name = '';
	 				}
	 				if(user.show_last_name == 0){
	 					user.last_name = '';
	 				}
	 				if(user.show_nick_name == 0){
	 					user.nick_name = '';
	 				}
	 				if(user.show_message == 0){
	 					user.message = '';
	 				}
	 				if(user.show_birthday == 0){
	 					user.birthday = '';
	 				}
	 				if(user.show_marital == 0){
	 					user.marital = '';
	 				}
	 				if(user.show_meeting == 0){
	 					user.meeting = '';
	 				}
	 				if(user.show_school == 0){
	 					user.school = '';
	 				}
	 				if(user.show_occupation == 0){
	 					user.occupation = '';
	 				}
	 				if(user.show_like == 0){
	 					user.like = '';
	 				}
	 				if(user.show_dislike == 0){
	 					user.dislike = '';
	 				}
	 				if(user.show_buy_me == 0){
	 					user.buy_me = '';
	 				}
	 				if(user.show_cheer == 0){
	 					user.cheer = '';
	 				}
	 				if(user.show_prediction == 0){
	 					user.prediction = '';
	 				}
	 				if(user.show_pic == 0){
	 					user.pic1 = '';
	 					user.pic2 = '';
	 					user.pic3 = '';
	 				}

	 				var query = sql.query('SELECT * FROM `message` WHERE `member_id` = ?', array, function(err, results){

	 					if(err){
				 			res.json({ fail : 'DB Connection Error' }).status(401);
				 		}
				 		else{
				 			console.log(results);
				 			res.render('user', { user : user, message : results, auth : auth });
				 		}

	 					
	 				});
	 			}
	 		}
	 	});
	 });
}
