var VERSION = {
	major: 0,
	minor: 1,
	bugfix: 3,
	state: 'a',
	name: 'ra',
	toString: function() {
		return '%s.%s.%s%s \'%s\''.format(this.major, this.minor, this.bugfix, this.state, this.name)
	}
};