var GameStatus = {
	Loading: 0,
	Waiting: 1,
	PositioningShips: 2,
	Playing: 3,
	Finished: 4
};

function Game() {
	var battlefield = null;
	var socket = null;
	var colors = {
		left: [0, 190, 220],
		right: [220, 120, 80]
	};

	this.status = GameStatus.Loading;

	this.render = function (container) {
		var css = '';
		var color;
		for (var key in colors) {
			if (colors.hasOwnProperty(key)) {
				color = colors[key].join(', ');
				css += '#matrix-' + key + '-field { border-color: rgba(' + color + ', 1.0); }';
				css += '#matrix-' + key + ' .box { background: rgba(' + color + ', 0.01); border-color: rgba(' + color + ', 0.15); color: rgba(' + color + ', 1.0); }';
				css += '#matrix-' + key + ' .box.cl { background: rgba(' + color + ', 0.04); }';
			}
		}

		var style = document.createElement('style');
		style.textContent = css;

		container.appendChild(style);

		battlefield = new BattleField({
			size: 12
		});
		battlefield.render(container, colors);
	};

	this.connect = function () {
		var clientId = 'C' + Math.round(Math.random() * 10000);

		socket = io();

		socket.on('connect', function () {
			console.log('io connect', clientId);
			socket.emit('ident', { type: 'console', prefix: 'CONSOLE', clientId: clientId });
			socket.emit('command', 'loadConnections');
		});

		socket.on('event', function (input) { // TODO rename event
			console.log('io event', input);
			/*if (typeof input === 'undefined') {
				return false;
			}
			switch (input.type) {
				case 'connect':
					//ui.sockets.add(input.connectionId, input);
					//append({ className: input.type, html: input.type.toUpperCase() + ' ' + input.connectionId });
					break;
				case 'disconnect':
					//ui.sockets.remove(input.connectionId);
					if (input.ident.prefix !== 'CONSOLE') {
						//append({ className: input.type, html: input.type.toUpperCase() + ' ' + input.ident.prefix + ' ' + input.connectionId });
					}
					break;
				default:
					//append({ className: input.type, html: input.type.toUpperCase() + ' ' + JSON.stringify(input) });
					break;
			}*/
		});

		socket.on('connections', function (connections) {
			console.log('io connections', connections);
			//ui.sockets.set(connections);
		});

		socket.on('log', function (input) {
			console.log('io log', input);
			//append({ className: 'log', input: input });
		});

		socket.on('ident', function (input) {
			console.log('io ident', input);
			//ui.sockets.ident(input.connectionId, input.ident.type, input.ident.prefix, input.ident);
			if (input.ident.prefix !== 'CONSOLE') {
				//append({ className: 'ident', html: 'IDENT ' + input.ident.prefix + ' ' + input.connectionId });
			}
		});

		socket.on('disconnect', function (input) {
			console.log('io disconnect', input);
			socket.emit('command', 'loadConnections');
			if (input === 'transport error' || input === 'transport close') {
			//	append({ className: 'disconnect', html: 'DISCONNECT (Restarting websocket.)' });
			} else {
				//append({ className: 'disconnect bg-red', html: 'DISCONNECT ' + JSON.stringify(input) });
			}
		});
	};

	this.play = function () {
	};
}

function BattleField(opts) {
	opts = opts || {};
	opts.size = opts.size || 12;

	var size = opts.size;
	var border = 3;
	var gap = 1;

	var offsetX = border + 1;
	var offsetY = border + 1;

	var sizeB = 18;
	var sizeA = sizeB - 1;
	var fontSize = 0.7;

	//var fields = {};

	function createMatrix(options) {
		options = options || {};
		options.left = options.left || 0;
		options.top = options.top || 0;

		var matrix = document.createElement('div');
		matrix.setAttribute('id', 'matrix-' + options.id);
		matrix.setAttribute('class', 'matrix');
		matrix.setAttribute('style', '\
			font-size: ' + Math.round(sizeB * fontSize) + 'px;\n\
			line-height: ' + parseInt(sizeB) + 'px;\n\
			left: ' + parseInt(sizeB * options.left) + 'px;\n\
			top: ' + parseInt(sizeB * options.top) + 'px;\n\
			width: ' + parseInt(sizeB * options.columns) + 'px;\n\
			height: ' + parseInt(sizeB * options.rows) + 'px;');
		for (var y = 0; y < options.rows; y++) {
			for (var x = 0; x < options.columns; x++) {
				var div = document.createElement('div');
				var box = new Box(options.id, x, y);
				div.setAttribute('id', box.id);
				div.setAttribute('class', 'box');
				div.setAttribute('style', 'width: ' + sizeA + 'px; height: ' + sizeA + 'px;');
				matrix.appendChild(div);
			}
		}

		//fields[options.id] = {
		//};

		return matrix;
	}

	function createField(options) {
		options = options || {};
		options.left = options.left || 0;
		options.top = options.top || 0;
		options.color = options.color || [0, 0, 0];

		var el = document.createElement('div');
		el.setAttribute('id', 'matrix-' + options.id + '-field');
		el.setAttribute('data-color-rgb', options.color.join(', '));
		el.setAttribute('class', 'field');
		el.setAttribute('style', '\
			left: ' + parseInt(sizeB * options.left + 1) + 'px;\n\
			top: ' + parseInt(sizeB * options.top + 1) + 'px;\n\
			width: ' + parseInt(sizeB * options.columns - 1) + 'px;\n\
			height: ' + parseInt(sizeB * options.rows - 1) + 'px;');

		el.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			return processFieldClick(options.id, e);
		});

		return el;
	}

	function Box(field, x, y, relative) {
		relative = relative || false;
		if (relative === false) {
			if (field === 'left') {
				x += offsetX;
				y += offsetY;
			}
			if (field === 'right') {
				x += offsetX + size + gap;
				y += offsetY;
			}
		}
		var id = 'map-' + field + '-x' + x + '-y' + y;
		var element = null;

		this.id = id;

		this.getElement = function () {
			if (element === null) {
				element = document.getElementById(id);
			}
			return element;
		};

		this.setValue = function (value) {
			this.getElement().textContent = value;
		};

		this.isChecked = function () {
			var el = this.getElement();
			if (el === null) {
				return false;
			}
			return /cl/.test(el.getAttribute('class'));
		};

		this.click = function (e) {
			this.toggleCheck();
			this.renderBorders(1);

			return true;
		};

		this.toggleCheck = function () {
			var el = this.getElement();
			if (this.isChecked()) {
				el.setAttribute('class', 'box');
				el.textContent = '';
			} else {
				el.setAttribute('class', 'box cl');
				el.textContent = 'α';
			}
		};

		this.getBorderColor = function (sibling) {
			if ((this.isChecked() && sibling.isChecked()) || (!this.isChecked() && !sibling.isChecked())) {
				return null; // '0.15';
			} else {
				var color = document.getElementById('matrix-' + field + '-field').getAttribute('data-color-rgb');
				return 'rgba(' + color + ', 1.0)';
			}
		}

		this.renderBorders = function (depth) {
			depth = typeof depth === 'number' ? depth : 0;

			var el = this.getElement();
			if (el === null) {
				return;
			}
			var directions = {
				Top: [0, -1],
				Right: [1, 0],
				Bottom: [0, 1],
				Left: [-1, 0]
			};

			var coords, box, color;
			for (var i in directions) {
				if (directions.hasOwnProperty(i)) {
					coords = directions[i];
					box = new Box(field, x+coords[0], y+coords[1], true);
					color = this.getBorderColor(box);
					el.style['border' + i + 'Color'] = color ? color : '';
					if (depth) {
						box.renderBorders(0);
					}
				}
			}
		};
	}

	function buildHorizontal() {
		var char;
		var A = 'A'.charCodeAt(0);
		for (var i = 0; i < size; i++) {
			char = String.fromCharCode(A + i);
			new Box('base', offsetX + i, border).setValue(char);
			new Box('base', offsetX + i, border + size + 1).setValue(char);
			new Box('base', offsetX + size + gap + i, border).setValue(char);
			new Box('base', offsetX + size + gap + i, border + size + 1).setValue(char);
		}
	}

	function buildVertical() {
		for (var i = 0; i < size; i++) {
			new Box('base', border, offsetY + i).setValue(i + 1);
			new Box('base', border + size + 1, offsetY + i).setValue(i + 1);
			if (gap > 1) {
				new Box('base', border + size + gap, offsetY + i).setValue(i + 1);
			}
			new Box('base', border + size + gap + size + 1, offsetY + i).setValue(i + 1);
		}
	}

	function processFieldClick(id, e) {
		var x = Math.floor(e.offsetX / sizeB);
		var y = Math.floor(e.offsetY / sizeB);
		var box = new Box(id, x, y);
		if (box.getElement() === null) {
			return false;
		}
		return box.click(e);
	}

	this.render = function (container, colors) {
		var baseColumns = offsetX + size + gap + size + offsetX;
		var baseRows = offsetY + size + offsetY;

		container.style.width = parseInt(sizeB * baseColumns) + 'px';
		container.style.height = parseInt(sizeB * baseRows) + 'px';

		var base = {
			id: 'base',
			columns: baseColumns,
			rows: baseRows
		};
		var left = {
			id: 'left',
			columns: size,
			rows: size,
			left: offsetX,
			top: offsetY,
			color: colors.left
		};
		var right = {
			id: 'right',
			columns: size,
			rows: size,
			left: offsetX + size + gap,
			top: offsetY,
			color: colors.right
		};
		container.appendChild(createMatrix(base));

		buildHorizontal();
		buildVertical();

		container.appendChild(createMatrix(left));
		container.appendChild(createField(left));

		container.appendChild(createMatrix(right));
		container.appendChild(createField(right));
	};
}
