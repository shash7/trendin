/* jslint undef: true */
/* global window, document, $ */

/* ----------------------------------------------------------------
 * routes.js
 * 
 * Contains all routes
 * ---------------------------------------------------------------- */


(function() {

	'use strict';
	
	var express   = require('express');
	var _         = require('underscore');
	var appConfig = require('../config.js');
	var db        = require('./db.js');
	
	var app = express();
	
	var globals = appConfig.vars;
	appConfig.setup(app, express);
	
	function checkUrl(url) {
		var arr = url.split('/');
		arr = _.compact(arr);
		if(arr[0] === 'http:') {
			arr[0] = null;
			arr = _.compact(arr);
		}
		if(arr[0] === 'i.imgur.com' && arr[1] !== 'css' && arr[1] !== 'js' && arr[1] !== 'public' && arr[1] !== 'img' ) {
			return arr[1];
		} else {
			return false;
		}
	}
	
	app.use(function (req, res, next) {
		var result = checkUrl(req.url);
		if(result && !req.isPost) {
			db.findByUrl(result, function(err, result2) {
				if(result2 && result2[0]) {
                    
          result2 = result2[0];
					res.render('index.html', result2);
				} else {
					var obj = {
						url : result
					};
					db.createImage(obj, function(err, data) {
						if(data) {
							res.render('index.html', data);
						} else {
							res.send('some probs');
						}
					});
				}
			});
		} else {
  		next();
		}
	});
	
	
/* ----------------------------------------------------------------
 * $routes
 * ---------------------------------------------------------------- */
	// GET requests
	app.get('/', function(req, res) {
		res.render('home.html');
	});
	
	/*app.get('/:url', function(req, res) {
		console.log(req.param('url'));
		res.send(req.param('url'));
	});*/
	
	app.post('/:url', function(req, res) {
		var url = req.param('url');
		if(req.body.tags.length > 0) {
			db.findByUrl(url, function(err, data) {
				if(data) {
					var obj = {
						id : data[0]._id,
						tags : req.body.tags
					};
					db.setTags(obj, function(err, result) {
						if(result) {
							res.status(201).send(result);
						} else {
							res.send(500);
						}
					});
				} else {
					console.log('urlzzzz');
					res.render('home.html');
				}
			});
		} else {
			res.send(403);
		}
	});
	
	app.post('/:url/tags', function(req, res) {
		var url = req.param('url');
		db.findByUrl(url, function(err, data) {
			if(data) {
				res.status(200).send(data[0]);
			} else {
				res.send(404);
			}
		});
	});
	
	// Serve static files
	app.use(express.static('public'));
	
	// Handles 404
	app.use(function(req, res, next) {
  	res.status(404);
		// respond with html page
		if (req.accepts('html')) {
			res.send(404);
			return;
		}

		// respond with json
		if (req.accepts('json')) {
			res.send({ error: 'Not found' });
			return;
		}

		// default to plain-text. send()
		res.type('txt').send('Not found');
	});
	
	// Starts the express app
	app.listen(globals.port, globals.host);
	
})();