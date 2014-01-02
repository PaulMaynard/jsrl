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
		this.screens.current.render();
	}
};
Game.display = new ROT.Display({width: Game.width, height: Game.height});

Game.screens.start= new Screen({
	render: function() {
		this.display.drawText(5, 5, '%c{red}Hello World!');
	}
});

Game.switchScreen('start');

document.body.appendChild(Game.display.getContainer());