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

Game.tiles = {
	wall: new Tile('#', 'white'),
	floor: new Tile('.', 'white'),
	door: new Tile('+', 'brown'),
	opendoor: new Tile('\'', 'brown'),
	player: new Tile('@', 'red'),
	empty: new Tile('', '')
}