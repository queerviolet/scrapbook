var Turtle = function Turtle(svg) {
	this.svg = svg;
	console.log(svg.width.baseVal.value);
	this.pos = [svg.width.baseVal.value / 2,
		svg.height.baseVal.value / 2];
	console.dir(this.pos);
	this.bearing = [1,0];
	this.rot = 0;
	this.cursor = this.makeCursor();

	this.stroke = 'fuchsia';
	this.animate = '2s';//113ms';
	this.penDown();
}

Turtle.CURSOR_PATH = 'M-10,-10L10,0L-10,10Z';
Turtle.SVG_NS = 'http://www.w3.org/2000/svg';

Turtle.prototype.penUp = function Turtle_penUp() {
	this.path = null;
}

Turtle.prototype.penDown = function Turtle_penDown() {
	if (!this.path) {
		this.path = this.mk('path', {
			fill: 'none',
			stroke: this.stroke
		});
		this.path.pathSegList.appendItem(this.path.$M(this.pos.x, this.pos.y));
		this.svg.appendChild(this.path);
	}
};

Turtle.prototype.moveTo = function Turtle_moveTo(x, y) {
	this.addPathSegAbs(this.path.$M(x, y));
};

Turtle.prototype.turn = function Turtle_turn(rad) {
	this.bearing = this.bearing.rot2(rad);
};

Turtle.prototype.forward = function Turtle_forward(mag) {
	var newPos = this.pos.sum2(this.bearing.scale2([mag, mag]));
	var seg = this.path.$L(newPos.x, newPos.y);
	this.addPathSegAbs(seg);
	return this;
};

Turtle.prototype.addPathSegAbs = function Turtle_addPathSegAbs(segment) {
	if (this.animate) {
		//this.animateStrokeSegment(segment);
		//this.animateCursorSegment(segment);
	}
	if (this.path) {
		this.path.pathSegList.appendItem(segment);
	}
	this.pos = [segment.x, segment.y];
};

Turtle.prototype.animCursorSegment = function Turtle_animCursorSegment(segment) {
	var anim = this.mk('animateMotion', {
		'class': 'turtle-anim',
		dur: this.animate,
		repeatCount: 1,
		rotate: 'auto',
		path: 'M' + this.pos.str2 + segment,
		fill: 'freeze',
		begin: 'indefinite'
	});
	anim.onend = this.onCursorAnimEnd.bind(this);
	this.cursor.appendChild(anim);
	anim.beginElement();
	return this;
};

Turtle.prototype.onAnimEnd = function Turtle_onAnimEnd(evt) {
	var t = evt.target;
	var tag = t.tagName;
	var p = t.parentElement;
	t.parentElement.removeChild(t);
	var queue = p.getElementsByTagName(tag);
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

Object.defineProperties(SVGElement.prototype, {
	'anim': {
		enumerable: true,
		get: function() {
			if (this._anim) { return this._anim; }
			return this._anim = new Anim(this);
		}
	}
});

SVGPathElement.prototype.$M = SVGPathElement.prototype.createSVGPathSegMovetoAbs;
SVGPathElement.prototype.$m = SVGPathElement.prototype.createSVGPathSegMovetoRel;
SVGPathElement.prototype.$L = SVGPathElement.prototype.createSVGPathSegLinetoAbs;
SVGPathElement.prototype.$l = SVGPathElement.prototype.createSVGPathSegLinetoRel;


