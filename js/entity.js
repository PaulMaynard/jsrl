function Entity(name, tile, x, y, map) {
	this.name = name;
	this.tile = tile;
	this.x = x;
	this.y = y;
	this.map = map;
}
_.assign(Entity.prototype, {
	move: function(x, y) {
		if (this.map.canMove(this, x, y)) {
			this.x += x;
			this.y += y;
		} else if (this.map.getTile(this.x + x, this.y + y) === 'door') {
			this.map.setTile(this.x + x, this.y + y, 'opendoor');
		}
	},
	setPos: function(p) {
		this.x = p.x;
		this.y = p.y;
	},
	closeDoors: function() {

	}
});

var player = new Entity('you', Game.tiles.player, 0, 0);;
