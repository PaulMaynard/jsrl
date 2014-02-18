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
