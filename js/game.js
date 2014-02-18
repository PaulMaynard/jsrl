'use strict';
document.title = 'jsrl2 v' + VERSION;
ROT.Display.Rect.cache = true;

var Game = {
	width: 80,
	height: 25,
	display: null,
	screens: {},
	redraw: function() {
		this.display.clear();
		this.screens.current.render();
	}
};
Game.display = new ROT.Display({width: Game.width, height: Game.height});
document.body.addEventListener('keydown', function(e) {
	Game.screens.current.handleKey(e.keyCode);
});

document.body.appendChild(Game.display.getContainer());