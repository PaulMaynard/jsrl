'use strict';
var VERSION = {
	major: 0,
	minor: 5,
	bugfix: 1,
	state: 'a',
	name: '',
	toString: function() {
		return '%s.%s.%s%s \'%s\''.format(this.major, this.minor, this.bugfix, this.state, this.name)
	}
};
document.title = 'jsrl v' + VERSION;

const WIDTH = 100, HEIGHT = 60, SIDEWIDTH = 42, TRAPNUM = 25, POTIONNUM = 40, MONSTERNUM = 25, WEAPONNUMN = 50;
var tiles = {
	wall: {
		tile: '#',
		color: 'white',
		bg: ''
	},
	floor: {
		tile: '.',
		color: 'white',
		bg: ''
	},
	door: {
		tile: '+',
		color: 'brown',
		bg: ''
		open: {
			tile: '\'',
			color: tiles.door.color,
			bg: tiles.door.bg
		}
	},
	trap: {
		tile: '^',
		color: 'red',
		bg: ''
	}
};
var WALL = '#', WALLALT = '%', WALLCOLOR = 'white', WALLBG = '',
	FLOOR = '.', FLOORALT = ',', FLOORCOLOR = 'white', FLOORBG = '',
	DOOR = '+', OPENDOOR = '\'', DOORCOLOR = 'brown', DOORBG = '',
	TRAP = '^', TRAPCOLOR = 'red', TRAPBG = '';
var POTION = '!';
var scheduler = new ROT.Scheduler.Simple();
function heal() {
	if (ROT.RNG.getPercentage() <= 20) {
		this.hp += 1;
		if (this.hp >= this.maxhp) {
			this.hp = this.maxhp;
		}
	}
}
var player = new Monster('you', '@', 'green', 20, 0, 0, heal);
scheduler.add(player, true);
var monsters = [];
var items = [];
var display = new ROT.Display({width: WIDTH + SIDEWIDTH, height: HEIGHT + 1});
var map = new ROT.Map.Digger(WIDTH, HEIGHT, {dugPercentage: 0.25});
var walls = [];
var features = [];
var visible = [];
var tiles = [];
var seen = [];
var rooms;
var fov;
var message = '';
var invText = 'Inventory';
var messages = [];
var name = '';
Element.prototype.on = Element.prototype.addEventListener;
document.body.appendChild(display.getContainer());
document.body.on('keydown', function(e) {
		if(screens.current.waiting) {
			screens.current.waiting(e.keyCode, e)
		} else {
			screens.current.handleKey(e.keyCode, e);
		}
});
Array.prototype.collapse = function() {
	var a = []
	for (var i = 0; i < this.length; i++) {
		var e = this[i];
		if (e != null) {
			a.push(e);
		}
	};
	return a;
};

var screens = {
	switch: function(name) {
		display.clear();
		this.current = this[name];
		this.current.enter();
		this.current.draw();
	},
	main: {
		enter: function() {
			setup();
			this.enter = function() {};
		},
		draw: function() {
			display.clear();
			calcSight();
			// map
				for (var i = 0; i < walls.length; i++) {
					for (var j = 0; j < walls[i].length; j++) {
						if(visible[i][j]){
							if(walls[i][j]) {
								display.draw(i, j, WALL, WALLCOLOR, WALLBG);
							} else {
								display.draw(i, j, FLOOR, FLOORCOLOR, FLOORBG);
							}
						} else if(seen[i][j]){
							if(walls[i][j]) {
								display.draw(i, j, WALL, 'gray');
							} else {
								display.draw(i, j, FLOOR, 'gray');
							}
						}
					}
				}
				for (var i = 0; i < features.length; i++) {
					for (var j = 0; j < features[i].length; j++) {
						var f = features[i][j];
						if(visible[i][j]){
							switch (f) {
								case '':
									break;
								case 'door':
									display.draw(i, j, DOOR, DOORCOLOR, DOORBG);
									break;
								case 'open':
									display.draw(i, j, OPENDOOR, DOORCOLOR);
								break;
								case 'trap':
									display.draw(i, j, TRAP, TRAPCOLOR, TRAPBG);
								break;
							}
						} else if(seen[i][j]){
							switch (f) {
								case '':
									break;
								case 'door':
									display.draw(i, j, DOOR, 'gray');
									break;
								case 'open':
									display.draw(i, j, OPENDOOR, 'gray');
								break;
								case 'trap':
									display.draw(i, j, TRAP, 'gray');
								break;
							}
						}
					}
				}
			// items
				for (var i of items) {
					if(visible[i.x][i.y] && i.onfloor){
						display.draw(i.x,  i.y, i.type.tile, i.type.color);
					}
					else if(seen[i.x][i.y] && i.onfloor){
						display.draw(i.x,  i.y, i.type.tile, 'gray');
					}
				}
			// creatures
				for (var m of monsters) {
					if(visible[m.x][m.y] && m.dead === false){
						display.draw(m.x,  m.y, m.tile, m.color);
					}
				}
				display.draw(player.x,  player.y, player.tile, player.color);
			//status & inventory
				var s = ''
				if (player.dead) {
					s = 'hp: %c{red}Dead'
				} else {
					s = 'hp: %s/%s'.format(player.hp, player.maxhp);
				}
				s += '%c{}';
				s = s.rpad('-', WIDTH + SIDEWIDTH + 4);
				display.drawText(0, HEIGHT, s);
				var msg = message;
				msg += '%c{}';
				msg = msg.rpad('-', WIDTH - 15);
				display.drawText(15, HEIGHT, msg);
				var m = messages.slice(-15).reverse()
				m.forEach(function(m, i) {
					display.drawText(WIDTH + 1, HEIGHT - (i + 1), m)
				});
				display.drawText(WIDTH + 1,  HEIGHT - 17, ''.rpad('-', SIDEWIDTH - 1));
				for (var i = 1; i < HEIGHT; i++) {
					display.draw(WIDTH,  i, '|');
				};
				display.drawText(WIDTH,  0, ('|-' + invText + ':').rpad('-', SIDEWIDTH));
				player.inv.forEach(function(item, i) {
					display.drawText(WIDTH + 1,  i + 1, i + ") " + item.type.name);
				});
				display.drawText(WIDTH + 1,  12, ''.rpad('-', SIDEWIDTH - 1));
				display.drawText(WIDTH + 1,  14, name);
				display.drawText(WIDTH + 1,  16, 'hp: %s/%s'.format(player.hp, player.maxhp));
				display.drawText(WIDTH + 1,  17, 'Damage: ' + player.dam);
		},
		waiting: false,
		handleKey: function(vk, e) {
			if (!this.waiting){
				switch (vk) {
					case ROT.VK_UP:
					case ROT.VK_NUMPAD8:
						player.move(0, -1);
						break;
					case ROT.VK_DOWN:
					case ROT.VK_NUMPAD2:
						player.move(0, 1);
						break;
					case ROT.VK_LEFT:
					case ROT.VK_NUMPAD4:
						player.move(-1, 0);
						break;
					case ROT.VK_RIGHT:
					case ROT.VK_NUMPAD6:
						player.move(1, 0);
						break;
					case ROT.VK_NUMPAD7:
					case ROT.VK_HOME:
						player.move(-1, -1);
						break;
					case ROT.VK_NUMPAD9:
					case ROT.VK_PAGE_UP:
						player.move(1, -1);
						break;
					case ROT.VK_NUMPAD1:
					case ROT.VK_END:
						player.move(-1, 1);
						break;
					case ROT.VK_NUMPAD3:
					case ROT.VK_PAGE_DOWN:
						player.move(1, 1);
						break;
					case ROT.VK_NUMPAD5:
					case ROT.VK_PERIOD:
						player.move(0, 0);
						break;
					case ROT.VK_C:
						closeDoors(player.x, player.y);
						break;
					case ROT.VK_G:
						player.grab()
						break;
					case ROT.VK_Q:
						getInv('Quaff', player.quaff.bind(player));
						break;
					case ROT.VK_D:
						getInv('Drop', player.drop.bind(player));
						break;
					case ROT.VK_L:
						screens.switch('look')
				}
			}
		}
	},
	start: {
		enter: function() {
			name = data.names.generate().capitalize()
			player.maxhp = player.hp = Math.round(ROT.RNG.getNormal(20, 5));
			player.dam = '1d' + Math.round(ROT.RNG.getNormal(6, 2));
			screens.current.draw();
		},
		draw: function() {
			display.clear();
			display.drawText(10, 20, 'jsrl v' + VERSION)
			display.drawText(15, 21, 'Name: %s  Health: %s  Damage: %s'.format(name, player.maxhp, player.dam));
			display.drawText(15, 22, 'Press [Space] for a new character, or [Enter] to start')
		},
		handleKey: function(vk) {
			switch (vk) {
				case ROT.VK_RETURN:
					screens.switch('main')
					break;
				case ROT.VK_SPACE:
					name = data.names.generate().capitalize()
					player.maxhp = player.hp = Math.round(ROT.RNG.getNormal(20, 5));
					player.dam = '1d' + Math.round(ROT.RNG.getNormal(6, 2));
					screens.current.draw();
					break;
			}
		}
	},
	look: {
		enter: function() {
			this.cursor.x = player.x;
			this.cursor.y = player.y;
		},
		draw: function() {
			screens.main.draw();
			display.draw(this.cursor.x, this.cursor.y, 'X', '#55f');
			var text = '';
			if (visible[this.cursor.x][this.cursor.y]) {
				if (monsters.at(this.cursor.x, this.cursor.y)) {
					text =  monsters.at(this.cursor.x, this.cursor.y).name
				} else if (items.at(this.cursor.x, this.cursor.y)) {
					text = items.at(this.cursor.x, this.cursor.y).type.name;
				} else if (features[this.cursor.x][this.cursor.y]) {
					switch (features[this.cursor.x][this.cursor.y]) {
						case 'door':
							text = 'door'
							break;
						case 'open':
							text = 'open door'
							break;
						case 'trap':
							text = 'trap'
							break;
					}
				} else {
					text = '';
				}
			} else {
				text = '';
			}
			display.drawText(this.cursor.x + 2, this.cursor.y, text)
		},
		handleKey: function(vk, e) {
			switch (vk) {
				case ROT.VK_UP:
				case ROT.VK_NUMPAD8:
					this.cursor.move(0, -1);
					break;
				case ROT.VK_DOWN:
				case ROT.VK_NUMPAD2:
					this.cursor.move(0, 1);
					break;
				case ROT.VK_LEFT:
				case ROT.VK_NUMPAD4:
					this.cursor.move(-1, 0);
					break;
				case ROT.VK_RIGHT:
				case ROT.VK_NUMPAD6:
					this.cursor.move(1, 0);
					break;
				case ROT.VK_NUMPAD7:
				case ROT.VK_HOME:
					this.cursor.move(-1, -1);
					break;
				case ROT.VK_NUMPAD9:
				case ROT.VK_PAGE_UP:
					this.cursor.move(1, -1);
					break;
				case ROT.VK_NUMPAD1:
				case ROT.VK_END:
					this.cursor.move(-1, 1);
					break;
				case ROT.VK_NUMPAD3:
				case ROT.VK_PAGE_DOWN:
					this.cursor.move(1, 1);
					break;
				case ROT.VK_NUMPAD5:
				case ROT.VK_PERIOD:
					this.cursor.move(0, 0);
					break;
				case ROT.VK_ESCAPE:
					display.clear();
					screens.switch('main');
					return;
			}
			this.draw();
		},
		cursor: {
			x: 0,
			y: 0,
			move: function(x, y) {
				this.x += x;
				this.y += y;
			}
		}
	}
}

var data = {
	monsters: [
		{
			name: 'orc',
			tile: 'o',
			color: 'lime',
			stats: {str:15},
			hp: 10
		},
		{
			name: 'kobold',
			tile: 'k',
			color: 'yellow',
			stats: {str:7},
			hp: 5
		}
	],
	potions: {
		effects: [
			{
				name: 'healing potion',
				effect:function(q) {
					q.heal(roll('1d10'));
				}
			},
			{
				name: 'greater healing potion',
				effect:function(q) {
					q.heal(10);
				}
			},
			{
				name: 'harming potion',
				effect:function(q) {
					q.hurt(roll('1d10'), 'potion');
				}
			},
			{
				name: 'potion of poison',
				effect: function(q) {
					q.addEffect(5, function(t) {
						t.hurt(roll('1d4'), 'poison');
					});
				}
			}
		],
		colors: [
			{
				name: 'red',
				color: 'red'
			},
			{
				name: 'green',
				color: 'green'
			},
			{
				name: 'blue',
				color: 'blue'
			},
			{
				name: 'silver',
				color: 'silver'
			},
			{
				name: 'orange',
				color: 'orange'
			},
			{
				name: 'purple',
				color: 'purple'
			}
		],
		adjectives: ['shimmering', 'bubbling', 'thick', 'clear', 'warm', 'cool']
	},
	weapons: [
		{
			name: 'sword',
			dam: '1d6'
		},
		{
			name: 'dagger',
			dam: '1d4'
		},
		{
			name: 'long sword',
			dam: '1d8'
		}
	],
	names: new ROT.StringGenerator({order: 3})
};

function Stats(s) {
	this.str = 10 + (s.str || 0);
	this.con = 10 + (s.con || 0);
}

var potiontypes = [];
data.potions.effects.forEach(function(e) {
	var a = data.potions.adjectives.random();
	var c = data.potions.colors.random();
	potiontypes.push({
		name: a + ' ' + c.name + ' potion',
		color: c.color,
		effect: e.effect,
		realName: e.name,
		tile: POTION,
		type: 'potion'
	});
})

function setup() {
	ROT.Display.Rect.cache = true;
	for (var i = 0; i < WIDTH; i++) { // set up walls
		walls[i] = []
		for (var j = 0; j < HEIGHT; j++) {
			walls[i][j] = false;
		}
	}
	map.create(function(x, y, wall) {
		walls[x][y] = !!wall;
	});
	rooms = map.getRooms(); //set up doors & traps
	for (var i = 0; i < WIDTH; i++) {
		features[i] = []
		for (var j = 0; j < HEIGHT; j++) {
			features[i][j] = '';
		}

	}
	for (var i = 0; i < rooms.length; i++) {
		rooms[i].getDoors(function(x, y) {
			features[x][y] = 'door';
		})
	}
	 for (var i = 0; i < TRAPNUM; i++) {
		var p = randomPos();
		features[p.x][p.y] = 'traphidden'
	}
	for (var i = 0; i < WIDTH; i++) { // set up visibility
		visible[i] = []
		for (var j = 0; j < HEIGHT; j++) {
			visible[i][j] = false;
		}
	}
	for (var i = 0; i < WIDTH; i++) {
		seen[i] = []
		for (var j = 0; j < HEIGHT; j++) {
			seen[i][j] = false;
		}
	}
	fov = new ROT.FOV.PreciseShadowcasting(function(x, y) {
		if (walls[x] !== undefined && walls[x][y] !== undefined) {
			if (walls[x][y] || features[x][y] === 'door') {
				return false;
			} else {
				return true;
			}
		} else return false;
	});
	for (var i = 0; i < POTIONNUM; i++) { //set up items
		var p = randomPos();
		var type = potiontypes.random();
		items.push(new Item(p.x, p.y, type));
	}
	for (var i = 0; i < MONSTERNUM; i++) { //set up monsters
		var p = randomPos()
		var m = data.monsters.random()
		var mon = new Monster(m.name, m.tile, m.color, m.dam, m.hp, p.x, p.y, function() {
			if (!this.dead && player.x >= this.x - 1 && player.x <= this.x + 1 && player.y >= this.y - 1 && player.y <= this.y + 1) {
				this.hit(player);
			}
			//this.move([-1, 0, 1].random(), [-1, 0, 1].random())
		})
		monsters.push(mon);
		scheduler.add(mon, true); /* true = recurring actor */
	}
	var p = randomPos()
	player.x = p.x;
	player.y = p.y;
	screens.current.draw();
}
function runTurn() {
	for (var i = 0; i <= monsters.length; i++) {
	    scheduler.next().turn();
	}
}

Array.prototype.at = function(x, y) {
	var at = false;
	this.forEach(function(i) {
		if (i.x === x && i.y === y) {
			at = i;
		}
	});
	return at;
}
function random(max) {
	return Math.floor(ROT.RNG.getUniform() * max);
}
function randomPos() {
	var p = {}
	do {
		p.x = random(WIDTH);
		p.y = random(HEIGHT);
	} while (walls[p.x][p.y] || features[p.x][p.y] !== '')
	return p;
}
function roll(die) {
	var d = die.split(/d/);
	var r = 0;
	for (var i = 0; i < d[0]; i++) {
		r += (random(d[1]) + 1)
	}
	return r;
}
function getInv(text, cb) {
	invText = text;
	screens.current.draw();
	function get(i) {
		if (player.inv[i]) {
			screens.current.waiting = false;
			invText = 'Inventory';
			cb(i);
		} else {
			log('Not in inventory')
		}
		screens.current.draw();
	}
	screens.current.waiting = function(vk, e) {
		switch (vk) {
			case ROT.VK_0:
				get(0);
				break;
			case ROT.VK_1:
				get(1);
				break;
			case ROT.VK_2:
				get(2);
				break;
			case ROT.VK_3:
				get(3);
				break;
			case ROT.VK_4:
				get(4);
				break;
			case ROT.VK_5:
				get(5);
				break;
			case ROT.VK_6:
				get(6);
				break;
			case ROT.VK_7:
				get(7);
				break;
			case ROT.VK_8:
				get(8);
				break;
			case ROT.VK_9:
				get(9);
				break;
			default:
				invText = 'Inventory';
				screens.current.waiting = false;
				screens.current.draw();
		}
			
		    
	};
}

function Item(x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.onfloor = true;
}
Item.prototype.quaff = function(quaffer) {
	if (this.type.type === 'potion') {
		this.type.effect(quaffer)
	}
}
function Monster(name, tile, color, hp, x, y, turn, stats) {
	this.name = name;
	this.tile = tile;
	this.color = color;
	this.dam = '1d2';
	this.hp = hp;
	this.maxhp = hp;
	this.x = x;
	this.y = y;
	this.dead = false;
	this.inv = [];
	this._turn = turn || function() {};
	this.hurtMsg = 'The %s hits the %s for %s damage';
	this.healMsg = 'The %s is healed for %s hp';
	this.dieMsg = 'The %s dies';
	this.effects = [];
	this.stats = JSON.parse(JSON.stringify(stats)) || {str: 10}
}
Monster.prototype.turn = function() {
	this._turn()
	for (var i = this.effects.length - 1; i >= 0; i--) {
		var e = this.effects[i]
		if (--e.dur > 0) {
			e.effect(this)
		}
	};
}
Monster.prototype.hurt = function(amt, src) {
	this.hp -= amt;
	log(this.hurtMsg.format(src, this.name, amt))
	if (this.hp <= 0) {
		this.die();
	}
}
Monster.prototype.heal = function(amt) {
	this.hp += amt;
	log(this.healMsg.format(this.name, amt));
	if (this.hp >= this.maxhp) {
		this.hp = this.maxhp;
	}
}
Monster.prototype.die = function() {
	log(this.dieMsg.format(this.name));
	this.dead = true;
	if (this in monsters) {
		monsters = monsters.splice(monsters.indexOf(this), 1);
	}
}
Monster.prototype.hit = function(target) {
	if (!target.dead) {
		target.hurt(roll(this.dam) + random(this.stats.str - 5), this.name);
	}
}
Monster.prototype.move = function(a, b) {
	if (!this.dead) {
		var x = this.x + a, y = this.y + b;
		if (canWalk(x, y)) {
			this.x = x;
			this.y = y;
			if (features[x][y] === 'trap' || features[x][y] === 'traphidden') {
				this.hurt(roll('1d6'), 'trap');
				if (features[x][y] === 'traphidden') {
					features[x][y] = 'trap'
				}
			}
		}
		if (features[x][y] === 'door') {
			features[x][y] = 'open';
		}
		if (monsters.at(x, y) && !monsters.at(x, y).dead) {
			this.hit(monsters.at(x, y))
		}
		screens.current.draw();
	}
}
Monster.prototype.grab = function() {
	var i = items.at(this.x, this.y)
	if (i.onfloor) {
		this.inv.push(i);
		i.onfloor = false;
		return i;
	}
	return { name: 'nothing' }
};
Monster.prototype.drop = function(i) {
	if(this.inv[i] !== undefined && this.inv[i] !== null) {
		var item = this.inv[i];
		item.x = this.x;
		item.y = this.y;
		item.onfloor = true;
		this.inv[i] = null;
		this.inv = this.inv.collapse()
		return item;
	}
	return { name: 'nothing' }
};
Monster.prototype.quaff = function(i) {
	if(this.inv[i] !== undefined && this.inv[i] !== null) {
		var potion = this.inv[i];
		potion.quaff(this);
		this.inv[i] = null;
		this.inv = this.inv.collapse()
		return potion;
	}
	return { name: 'nothing' }
};
Monster.prototype.addEffect = function(dur, fn) {
	this.effects.push({dur: dur, effect: fn})
}
player.dieMsg = 'You die';
player.hurtMsg = 'The %s hits %s for %s damage';
player.heal = function(amt) {
	this.hp += amt;
	log('You are healed for ' + amt + ' hp');
	if (this.hp >= this.maxhp) {
		this.hp = this.maxhp;
	};
};
player.hit = function(target) {
	var msg = target.hurtMsg;
	target.hurtMsg = '%s hit the %s for %s damage'
	Monster.prototype.hit.call(this, target);
	target.hurtMsg = msg;
}
player.move = function(a, b) {
	Monster.prototype.move.call(this, a, b)
	calcSight();
	runTurn();
}
player.grab = function() {
	if (this.inv.length < 10) {
		var i = Monster.prototype.grab.call(this)
		log('You grab the ' + i.type.name)
	} else {
		log('Your inventory is full')
	}
	screens.current.draw();
	runTurn();
}
player.drop = function(i) {
	var it = Monster.prototype.drop.call(this, i);
	log('You drop the ' + it.type.name);
	runTurn();
}
player.quaff = function(i) {
	var p = Monster.prototype.quaff.call(this, i);
	p.type.name = p.type.realName;
	log('You quaff a ' + p.type.name);
	runTurn();
};
function calcSight() {
	for (var i = 0; i < WIDTH; i++) {
		for (var j = 0; j < HEIGHT; j++) {
			visible[i][j] = false;
		}
	}
	fov.compute(player.x, player.y, 10, function(x, y, r, visibility) {
		if (visibility > 0.1) {
			visible[x][y] = true;
			seen[x][y] = true;
		} else {
			visible[x][y] = false;
		}
	});
}
function isInRoom(x, y, left, top, right, bottom) {
	return ((x >= left) && (x <= right)) && ((y >= top) && (x <= bottom))
}
function handleCtrlKey(vk) {
	switch (vk) {

	}
}
function handleShiftKey(vk) {
	switch (vk.keyCode) {

	}
}
function handleAltKey(vk) {
	switch (vk.keyCode) {

	}
}
function closeDoors(x, y) {
	if (!player.dead) {
		if (features[x][y - 1] === 'open') { // up
			features[x][y - 1] = 'door';
		} if (features[x][y + 1] === 'open') { // down
			  features[x][y + 1] = 'door';
		} if (features[x - 1][y] === 'open') { // left
			  features[x - 1][y] = 'door';
		} if (features[x + 1][y] === 'open') { // right
			  features[x + 1][y] = 'door';
		} if (features[x - 1][y - 1] === 'open') { // up left
			  features[x - 1][y - 1] = 'door';
		} if (features[x + 1][y - 1] === 'open') { // up right
			  features[x + 1][y - 1] = 'door';
		} if (features[x - 1][y + 1] === 'open') { // down left
			  features[x - 1][y + 1] = 'door';
		} if (features[x + 1][y + 1] === 'open') { // down right
			  features[x + 1][y + 1] = 'door';
		}
		runTurn();
		screens.current.draw();
	}
}
function canWalk(x, y) {
	var yes = true;
	if (((x < 0) || (x >= WIDTH)) && !((y < 0) || (y >= HEIGHT))) { // on map
		yes = false
	}
	if (walls[x][y]) { // is floor
		yes = false
	}
	if (features[x][y] === 'door') { // no door
		yes = false
	}
	if (monsters.at(x, y) && monsters.at(x, y).dead === false) { // no monster
		yes = false
	}
	return yes;
}
function log(msg) {
	message = msg;
	messages.push(msg)
	screens.current.draw();
}
// start
if (!localStorage.names) {
	var names = []
	var r = new XMLHttpRequest();
	r.open("get", "names.txt", true);
	r.send();
	r.onreadystatechange = function() {
		if (r.readyState != 4) { return; }

	    var lines = r.responseText.split("\n");
	    while (lines.length) { 
	        var line = lines.pop().trim();
	        if (!line) { continue; }
	        data.names.observe(line); 
	        names.push(line)
	    }
	    localStorage.names = names.join(',')
	}
} else {
	localStorage.names.split(',').forEach(function(n) {
		data.names.observe(n)
	});
}

screens.switch('start');