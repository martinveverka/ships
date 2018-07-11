var port = process.env.PORT || 5000;

function Game() {
	var userLimit = 2;
	var users = {};
	var status = null;

	this.addUser = function (userId) {

	};
}

function GameServer() {
	var server = this;
	var express = require('express');
	var app = express();
	var http = require('http').Server(app);
	//var fs = require('fs');
	var io = require('socket.io')(http);

	var connections = {};
	var games = {};

	this.initialize = function (port) {
		app.use(express.static(__dirname + '/'));

		io.on('connection', function (socket) {
			new GameSocket(server, io).processSocket(socket);
		});
		http.listen(port);
		console.log("http server listening on %d", port);
	};

	this.getConnections = function () {
		return connections;
	};

	/**
	 * @param {object} socket
	 * @returns {GameConnection}
	 */
	this.createConnection = function (socket) {
		connections[socket.id] = new GameConnection(socket);
		console.log(connections);
		return connections[socket.id];
	};

	/**
	 * @param {object} socket
	 * @returns {GameConnection}
	 */
	this.getConnection = function (socket) {
		return connections[socket.id];
	};

	this.setConnectionStatus = function (socket, status) {
		if (connections.hasOwnProperty(socket.id)) {
			connections[socket.id].status = status;
		}
		console.log(connections);
	};

	this.removeConnection = function (socket) {
		if (connections.hasOwnProperty(socket.id)) {
			delete connections[socket.id];
		}
		console.log(connections);
	};

	this.createGame = function (id) {
		games[id] = new Game();
	};

	return this;
}

function GameConnection(socket) {
	this.status = null;
	this.type = null;
	this.prefix = null;
	this.clientId = null;
	this.ident = {
		connectionId: socket.id
	};
}

/**
 * @param {Console} server
 * @param {object} io
 * @returns {GameSocket}
 */
function GameSocket(server, io) {
	this.processSocket = function (socket) {
		var connection = server.createConnection(socket);
		connection.status = 'connected';

		socket.on('error', function (e) {
			io.emit('event', { type: 'error', data: 'Error', prefix: 'EXCEPTION', e: e });
			server.removeConnection(socket);
		});

		io.emit('event', { type: 'connect', connectionId: socket.id });

		socket.on('disconnect', function () {
			io.emit('event', { type: 'disconnect', connectionId: socket.id, ident: connection.ident });
			server.removeConnection(socket);
		});
/*
		socket.on('command', function (input) {
			//new ConsoleCommand(server, io, socket, connection).processCommand(input);
		});

		socket.on('log', function (input) {
			// TODO posilat pouze do konzole
			io.emit('log', {
				data: input,
				prefix: typeof connection.ident.prefix !== 'undefined' ? connection.ident.prefix : null
			});
		});*/

		socket.on('ident', function (input) {
			for (var i in input) {
				connection.ident[i] = input[i];
			}

			connection.status = 'identified';
			connection.type = input.type;
			connection.prefix = input.prefix;

			if (input.type === 'console') {
				connection.clientId = input.clientId;
			}

			// TODO posilat pouze do konzole
			io.emit('ident', { ident: connection.ident, connectionId: socket.id });
		});

	};

	return this;
}

var server = new GameServer();
server.initialize(port);
server.createGame(id);
