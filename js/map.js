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