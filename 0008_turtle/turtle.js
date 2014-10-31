var Turtle = function Turtle(svg) {
	this.svg = svg;
	this.pos = [svg.clientWidth / 2, svg.clientHeight / 2];
	this.bearing = [1,0];
	this.rot = 0;
	this.cursor = this.makeCursor();

	this.stroke = 'fuchsia';
	this.animate = '113ms';

	this.queue = [];
	this.penDown();
}

Turtle.CURSOR_PATH = 'M-10,-10L10,0L-10,10Z';
Turtle.SVG_NS = 'http://www.w3.org/2000/svg';

Turtle.prototype.penUp = function Turtle_penUp() {
	this.path = null;
};

Turtle.prototype.penDown = function Turtle_penDown() {
	if (!this.path) {
		this.pathData = 'M' + this.pos;
		this.path = this.mk('path', {
			fill: 'none',
			stroke: this.stroke,
			d: this.pathData
		});
		this.svg.appendChild(this.path);
	}
};

Turtle.prototype.moveTo = function Turtle_moveTo(x, y) {
	this.penUp();
	var newPos = [x,y];
	if (this.animate) {
		this.animateCursor(new PathSeg('M', [], this.pos),
			new PathSeg('L', [], newPos));
	}
	this.pos = newPos;
	this.penDown();
};

Turtle.prototype.turn = function Turtle_turn(rad) {
	this.bearing = this.bearing.rot2(rad);
};

Turtle.prototype.forward = function Turtle_forward(mag) {
	var newPos = this.pos.sum2(this.bearing.scale2([mag, mag]));
	this.addPathSegAbs(new PathSeg('L', [], this.pos),
		new PathSeg('L', [], newPos));
	return this;
};

Turtle.prototype.curve = function Turtle_curve(x, y, x1, y1, x2, y2) {
	var c1 = this.pos.sum2([x1, y1]);
	var c2 = this.pos.sum2([x2, y2]);
	var end = this.pos.sum2([x, y]);
	this.addPathSegAbs(new PathSeg('C', [c1, c2], this.pos),
		new PathSeg('C', [c1, c2], end));
};

Turtle.prototype.addPathSegAbs = function Turtle_addPathSegAbs(from, to) {
	if (this.animate) {
		this.animateCursor(from, to);
	}
	this.pathData += '' + to;
	if (this.path) {
		var oldLen = this.path.getTotalLength();
		this.path.setAttribute('d', this.pathData);
		var newLen = this.path.getTotalLength();
		this.path.setAttribute('stroke-dasharray', newLen);
		this.path.setAttribute('stroke-dashoffset', newLen - oldLen);
		if (this.animate) {
			this.animateStroke(from, to);			
		}
	}
	this.pos = to.to;
};

Turtle.prototype.animateStroke = function Turtle_animateStroke(from, to) {
	var anim = this.mk('animate', {
		'class': 'turtle-anim',
		attributeName: 'stroke-dashoffset',
		dur: this.animate,
		repeatCount: 1,
		from: this.path.getAttribute('stroke-dashoffset'),
		to: 0,
		begin: 'indefinite',
		fill: 'freeze',
	});
	anim.onend = this.onAnimEnd.bind(this);
	this.path.appendChild(anim);
	var queue = this.path.getElementsByClassName('turtle-anim');
	if (queue.length == 1) {
		anim.beginElement();
	}
	return this;
};

Turtle.prototype.animateCursor = function Turtle_animateCursor(from, to) {
	var anim = this.mk('animateMotion', {
		'class': 'turtle-anim',
		dur: this.animate,
		repeatCount: 1,
		rotate: 'auto',
		path: 'M' + this.pos + to,
		fill: 'freeze',
		begin: 'indefinite'
	});
	anim.onend = this.onAnimEnd.bind(this);
	this.cursor.appendChild(anim);
	var queue = this.cursor.getElementsByClassName('turtle-anim');
	if (queue.length == 1) {
		this.cursor.removeAttribute('transform');
		anim.beginElement();
	}
	return this;
};

Turtle.prototype.onAnimEnd = function Turtle_onAnimEnd(evt) {
	var t = evt.target;
	var p = t.parentElement;
	p.removeChild(t);
	var queue = p.getElementsByClassName('turtle-anim');
	if (queue.length != 0) {
		queue[0].beginElement();
	} else {
		if (p == this.cursor) {
			this.cursor.setAttribute('transform', this.cursorTransform());
		}
	}
};

Turtle.prototype.makeCursor = function Turtle_makeTurtle() {
	var cursor = this.mk('path', {
		d: Turtle.CURSOR_PATH,
		'class': 'turtle',
		transform: this.cursorTransform()
	});
	this.svg.appendChild(cursor);
	return cursor;
};

Turtle.prototype.cursorTransform = function Turtle_cursorTransform() {
	return ['translate', this.pos.str2,
			'rotate(', this.rot, ')'].join(' ');
};

Turtle.prototype.mk = function Turtle_mk(tag) {
	var attrs = {};
	var children = [];
	for (var i = 1; i < arguments.length; ++i) {
		if (Array.isArray(arguments[i])) {
			children = arguments[i];
		} else {
			attrs = arguments[i];
		}
	}
	var el = document.createElementNS(Turtle.SVG_NS, tag);
	for (attr in attrs) {
		el.setAttribute(attr, attrs[attr]);
	}
	for (var i = 0; i != children.length; ++i) {
		el.appendChild(children[i]);
	}
	return el;
};

var PathSeg = function PathSeg(cmd, args, to) {
	this.cmd = cmd;
	this.args = args;
	this.to = to;
};

PathSeg.prototype.toString = function PathSeg_toString() {
	return this.cmd + ' ' + this.args.join(' ') + ' ' + this.to;
};

Object.defineProperties (Array.prototype, {
	x: {
		enumerable: false,
		get: function() { return this[0]; }
	},
	y: {
		enumerable: false,
		get: function() { return this[1]; }
	},
	xy: {
		enumerable: false,
		get: function() { return this; }
	},
	yx: {
		enumerable: false,
		get: function() { return [this.y, this.x]; }
	},
	str2: {
		enumerable: false,
		get: function() {
			return '(' + this.x + ',' + this.y + ')';
		}
	},
	mag2: {
		enumerable: false,
		get: function() {
			return Math.sqrt(this.dot2(this));
		}
	}
});

Array.prototype.sum2 = function sum2(other) {
	return [this.x + other.x, this.y + other.y];
};

Array.prototype.rot2 = function rot2(rad) {
	var cos = Math.cos(rad);
	var sin = Math.sin(rad);
	return [this.x * cos + this.y * sin,
            -this.x * sin + this.y * cos];
};

Array.prototype.dot2 = function dot2(other) {
	return this.x * other.x + this.y * other.y;
};

Array.prototype.angle2 = function angle2(other) {
	return Math.acos(this.dot2(other) / (this.mag2 * other.mag2));
};

Array.prototype.reflect2 = function reflect2(other) {
	return this.rot2(2 * this.angle2(other));
};

Array.prototype.scale2 = function scale2(other) {
	return [this.x * other.x, this.y * other.y];
};
