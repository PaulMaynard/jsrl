'use strict';
const VERSION = {
	major: 0,
	minor: 1,
	bugfix: 0,
	state: 'a',
	name: 'deuced',
	toString: function() {
		return '%s.%s.%s%s \'%s\''.format(this.major, this.minor, this.bugfix, this.state, this.name)
	}
};
Object.seal(VERSION);