function Map(gen) {
	var tiles = [], features = [];
	for (var x = 0; x < gen._height; x++) {
		tiles.push([]);
		features.push([]);
	}
	gen.create(function(x, y, wall) {
		tiles[x][y] = wall ? 'wall' : 'floor';
	});
	function doors(x, y) {
		features[x][y] = 'door';
	}
	if (gen.getRooms) {
		var rooms = gen.getRooms();
		rooms.forEach(function(r) {
			r.getDoors(doors);
		});
	}
	this.tiles = tiles;
	this.features = features;
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
	getFeature: function(x, y) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			return 'empty';
		} else {
			return this.features[x][y];
		}
	},
	setFeature: function(x, y, val) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			this.features[x][y] = val;
		}
	},
	getRect: function(x, y, w, h) {
		return {
			tiles: _.map(this.tiles.slice(x, x + w + 1), function(c) {
				return c.slice(y, y + w + 1)
			}),
			features: _.map(this.features.slice(x, x + w + 1), function(c) {
				return c.slice(y, y + w + 1)
			}),
		}
	},
	setRect: function(x, y, t, type) {
		type = type || 'tiles';
		_.each(t, function(r, i) {
			_.each(r, function(t, j) {
				this[type][x + i][y + j] = t;
			}, this);
		}, this)
	},
	canMove: function(o, x, y) {
		var tiles = /^(wall|empty)$/,
			features = /^(door)$/
		x = x || 0;
		y = y || 0;
		return !(tiles.test(this.getTile(o.x + x, o.y + y)) || features.test(this.getFeature(o.x + x, o.y + y)));
	},
	randomPos: function() {
		var p = {x: 0, y: 0}, x, y;
		while (!this.canMove(p)) {
			x = Math.floor(ROT.RNG.getUniformInt(0, this.width));
			y = Math.floor(ROT.RNG.getUniformInt(0, this.height));
			p = {x: x, y: y};
		}
		return p;
	}
});