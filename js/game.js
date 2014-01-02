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

Game.screens.start = new Screen({
	render: function() {
		this.display.drawText(5, 5, '%c{red}Hello World!');
	}
});
Game.screens.main = new Screen(function(){
	var x = Math.floor(ROT.RNG.getUniform() * Game.width),
		y = Math.floor(ROT.RNG.getUniform() * Game.height);
	console.log(x, y);
	this.display.draw(x, y, '@');
});
Game.screens.hello = new Screen(function(){
	var foreground, background, colors;
	for (var i = 0; i < 10; i++) {
	    // Calculate the foreground color, getting progressively darker
	    // and the background color, getting progressively lighter.
	    foreground = ROT.Color.interpolate([0, 255, 0], [255, 0, 0], i / 10);
	    background = ROT.Color.interpolate([255, 255, 255], [0, 0, 0], i / 10);
	    // Create the color format specifier.
	    colors = "%c{" + ROT.Color.toRGB(foreground) + "}%b{" + ROT.Color.toRGB(background) + "}";
	    // Draw the text at col 2 and row i
	    this.display.drawText(2, i, colors + "Hello, world!");
	}
});

Game.switchScreen('start');

document.body.appendChild(Game.display.getContainer());