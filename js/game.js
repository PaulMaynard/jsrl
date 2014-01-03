'use strict';
document.title = 'jsrl2 v' + VERSION;

function Screen(options, display) {
	this.display = display || Game.display;
	if (_.isFunction(options)) {
		this.render = options;
	} else {
		_.assign(this, _.pick(options, ['name', 'enter', 'exit', 'render', 'handleKey']));
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
	move: function(x, y) {
		this.x += x;
		this.y += y;
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
		if (this.screens.current.enter) {
			this.screens.current.enter();
		}
		this.display.clear();
		this.screens.current.render();
	},
	redraw: function() {
		this.display.clear();
		this.screens.current.render();
	}
};
Game.display = new ROT.Display({width: Game.width, height: Game.height});
document.body.addEventListener("keydown", function(e) {
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
	enter: function() {
		var x = Math.floor(ROT.RNG.getUniform() * Game.width),
			y = Math.floor(ROT.RNG.getUniform() * Game.height);
		player = new Entity('you', new Tile('@'), x, y);
	},
	render: function() {
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
			case ROT.VK_LEFT:
			case ROT.VK_4:
				player.move(-1, 0)
				Game.redraw();
				break;
			case ROT.VK_RIGHT:
			case ROT.VK_6:
				player.move(1, 0)
				Game.redraw();
				break;
			case ROT.VK_UP:
			case ROT.VK_8:
				player.move(0, -1)
				Game.redraw();
				break;
			case ROT.VK_DOWN:
			case ROT.VK_2:
				player.move(0, 1)
				Game.redraw();
				break;
			case ROT.VK_7:
			case ROT.VK_HOME:
				player.move(-1, -1);
				Game.redraw();
				break;
			case ROT.VK_9:
			case ROT.VK_PAGE_UP:
				player.move(1, -1);
				Game.redraw();
				break;
			case ROT.VK_1:
			case ROT.VK_END:
				player.move(1, -1);
				Game.redraw();
				break;
			case ROT.VK_3:
			case ROT.VK_PAGE_DOWN:
				player.move(1, 1);
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
			colors = "%c{" + ROT.Color.toRGB(foreground) + "}%b{" + ROT.Color.toRGB(background) + "}";
			// Draw the text at col 2 and row i
			this.display.drawText(2, i, colors + "Hello, world!");
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