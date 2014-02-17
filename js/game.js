'use strict';
document.title = 'jsrl2 v' + VERSION;
ROT.Display.Rect.cache = true;

function Screen(options, display) {
	this.display = display || Game.display;
	if (_.isFunction(options)) {
		this.render = options;
	} else {
		_.assign(this, _.pick(options, ['name', 'init', 'enter', 'exit', 'render', 'handleKey']));
	}
}

function Tile(char, color, bg) {
	this.char = char;
	this.color = color;
	this.bg = bg;
}
ROT.Display.prototype.drawTile = function(x, y, tile) {
	this.draw(x, y, tile.char, tile.color, tile.bg);
};
ROT.Display.prototype.drawEntity = function(e) {
	this.drawTile(e.x, e.y, e.tile);
};

function Entity(name, tile, x, y) {
	this.name = name;
	this.tile = tile;
	this.x = x;
	this.y = y;
}
_.assign(Entity.prototype, {
	move: function(x, y, map) {
		if (map.canMove(this, x, y)) {
			this.x += x;
			this.y += y;
		} else if (map.getTile(this.x + x, this.y + y) === 'door') {
			map.setTile(this.x + x, this.y + y, 'opendoor');
		}
	}
});

function Map(gen) {
	var tiles = [];
	for (var x = 0; x < gen._width; x++) {
		tiles.push([]);
	}
	gen.create(function(x, y, wall) {
		tiles[x][y] = wall ? 'wall' : 'floor';
	});
	function doors(x, y) {
		tiles[x][y] = 'door';
	}
	if (gen.getRooms) {
		var rooms = gen.getRooms();
		for (var i of rooms) {
			i.getDoors(doors);
		}
	}
	this.tiles = tiles;
	this.width = tiles.length;
	this.height = tiles[0].length;
}
_.assign(Map.prototype, {
	getTile: function(x, y) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			return 'empty';
		} else {
			return this.tiles[x][y];
		}
	},
	setTile: function(x, y, val) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			this.tiles[x][y] = val;
		}
	},
	canMove: function(o, x, y) {
		x = x || 0;
		y = y || 0;
		return !(/^(wall|door|empty)$/.test(this.getTile(o.x + x, o.y + y)));
	},
	randomPos: function() {
		var p = {x: 0, y: 0}, x, y;
		while (!this.canMove(p)) {
			x = Math.floor(ROT.RNG.getUniform() * this.width);
			y = Math.floor(ROT.RNG.getUniform() * this.height);
			p = {x: x, y: y};
		}
		return p;
	}
});

var Game = {
	width: 80,
	height: 25,
	display: null,
	screens: {},
	switchScreen: function(name) {
		if (this.screens.current && this.screens.current.exit) {
			this.screens.current.exit();
		}
		this.screens.current = this.screens[name];
		if (this.screens.current.init) {
			this.screens.current.init();
			delete this.screens.current.init;
		}
		if (this.screens.current.enter) {
			this.screens.current.enter();
		}
		this.display.clear();
		this.screens.current.render();
	},
	redraw: function() {
		this.display.clear();
		this.screens.current.render();
	},
	tiles: {
		wall: new Tile('#', 'white'),
		floor: new Tile('.', 'white'),
		door: new Tile('+', 'brown'),
		opendoor: new Tile('\'', 'brown'),
		player: new Tile('@', 'red'),
		empty: new Tile('', '')
	}
};
Game.display = new ROT.Display({width: Game.width, height: Game.height});
document.body.addEventListener('keydown', function(e) {
	Game.screens.current.handleKey(e.keyCode);
});

Game.screens.start = new Screen({
	render: function() {
		this.display.drawText(5, 5, 'Welcome to jsrl2 ' + VERSION);
		this.display.drawText(5, 6, 'Press [Enter] to play or [Space] to lose');
	},
	handleKey: function(key) {
		switch (key) {
			case ROT.VK_RETURN:
				Game.switchScreen('main');
				break;
			case ROT.VK_SPACE:
				Game.switchScreen('test');
		}
	}
});
var player;
Game.screens.main = new Screen({
	init: function() {
		this.map = new Map(new ROT.Map.Digger(Game.width, Game.height));
		var p = this.map.randomPos();
		player = new Entity('you', Game.tiles.player, p.x, p.y);
	},
	render: function() {
		for (var i = 0; i < this.map.tiles.length; i++) {
			for (var j = 0; j < this.map.tiles[i].length; j++) {
				this.display.drawTile(i, j, Game.tiles[this.map.getTile(i, j)] || Game.tiles.empty);
			}
		}
		this.display.drawEntity(player);
	},
	handleKey: function(key) {
		switch (key) {
			case ROT.VK_ESCAPE:
				Game.switchScreen('start');
				break;
			case ROT.VK_SPACE:
				Game.switchScreen('test');
				break;
			// Movement
			case ROT.VK_NUMPAD4:
			case ROT.VK_LEFT:
				player.move(-1, 0, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD6:
			case ROT.VK_RIGHT:
				player.move(1, 0, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD8:
			case ROT.VK_UP:
				player.move(0, -1, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD2:
			case ROT.VK_DOWN:
				player.move(0, 1, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD7:
			case ROT.VK_HOME:
				player.move(-1, -1, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD9:
			case ROT.VK_PAGE_UP:
				player.move(1, -1, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD1:
			case ROT.VK_END:
				player.move(-1, 1, this.map);
				Game.redraw();
				break;
			case ROT.VK_NUMPAD3:
			case ROT.VK_PAGE_DOWN:
				player.move(1, 1, this.map);
				Game.redraw();
				break;
		}
	}
});
Game.screens.test = new Screen({
	render: function(){
		var foreground, background, colors;
		for (var i = 0; i < 15; i++) {
			// Calculate the foreground color, getting progressively darker
			// and the background color, getting progressively lighter.
			foreground = ROT.Color.randomize([128, 128, 128], [64, 64, 64]);
			background = ROT.Color.interpolate([255, 255, 255], [0, 0, 0], i / 15);
			// Create the color format specifier.
			colors = '%c{' + ROT.Color.toRGB(foreground) + '}%b{' + ROT.Color.toRGB(background) + '}';
			// Draw the text at col 2 and row i
			this.display.drawText(2, i, colors + 'You lose!');
		}
	},
	handleKey: function(key) {
		switch (key) {
			case ROT.VK_ESCAPE:
				Game.switchScreen('start');
				break;
			case ROT.VK_SPACE:
				Game.switchScreen('main');
		}
	}
});

Game.switchScreen('start');

document.body.appendChild(Game.display.getContainer());