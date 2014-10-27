var Turtle = function Turtle(svg) {
	this.svg = svg;
	this.pos = [svg.width.baseVal.value / 2,
		svg.height.baseVal.value / 2];
	this.bearing = [1,0];
	this.rot = 0;
	this.stroke = 'fuchsia';
	this.cursor = this.makeCursor();

	this.animate = '2s';//113ms';	
	//this.animCursorTo(this.pos);	

	this.penDown();
}

Turtle.CURSOR_PATH = 'M-10,-10L10,0L-10,10Z';
Turtle.SVG_NS = 'http://www.w3.org/2000/svg';

Turtle.prototype.penDown = function Turtle_penDown() {
	this.stroke = this.mk('path', {
		d: 'M' + this.pos,
		fill: 'none',
		stroke: this.stroke
	});
	this.svg.appendChild(this.stroke);
};

Turtle.prototype.lineTo = function Turtle_lineTo(x, y) {};

Turtle.prototype.animCursorTo = function Turtle_animCursorTo(to) {
	var queue = this.cursor.getElementsByTagName('animateMotion');
	var from = this.pos;
	var prev = null;
	if (queue.length != 0) {
		prev = queue[queue.length - 1];
		from = prev.toPos;
	}
	var anim = this.mk('animateMotion', {
		dur: this.animate,
		repeatCount: 1,
		rotate: 'auto',
		path: 'M' + from + 'L' + to,
		fill: 'freeze',
		begin: 'indefinite'
	});
	anim.fromPos = from;
	anim.toPos = to;	
	anim.onend = this.onAnimEnd.bind(this);
	this.cursor.appendChild(anim);
	anim.beginElement();
	return this;
};

Turtle.prototype.onAnimEnd = function Turtle_onAnimEnd(evt) {
	/*var t = evt.target;
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
	}*/
};

Turtle.prototype.makeCursor = function Turtle_makeTurtle() {
	var cursor = this.mk('path', {
		d: Turtle.CURSOR_PATH,
		'class': 'turtle'/*,
		transform: this.cursorTransform()*/
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

var PathNode = function PathNode(cmd, params) {
	this.cmd = cmd;
	this.params = params;
	for (var i = 0; i != params.length; ++i) {
		this[params[i][0]] = params[i][1];
	}
};

PathNode.prototype.toString = function PathNode_toString() {
	return this.cmd + this.params.map(function(p) { return p[1]; }).join(' ');
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

var Anim = function Anim(element) {
	this.element = element;
	this.queue = [];
};

Anim.prototype.moveAlongPath = function Anim_moveAlongPath(path, opt_options) {
	var options = opt_options || {};
	options.dur = options.dur || '1s';
	options.repeatCount = options.repeatCount || 1;
	options.rotate = options.rotate || 'auto';
	options.fill = options.freeze || 'fill';
	options.begin = options.begin || 'indefinite';

	var anim = this.mk('animateMotion', options);
	anim.onbegin = this.beginMoveHandler.bind(this);
	anim.onend = this.endMoveHandler.bind(this);

	this.element.appendChild(anim);
	if (options.begin == 'indefinite') {
		anim.beginElement();
	}
	return this;	
};

Anim.prototype.beginMoveHandler = function Anim_beginMoveHandler(evt) {
	if (this.originalTransform) {
		this.element.setAttribute('transform', this.originalTransform);
	} else if (this.element.hasAttribute('transform')) {
		this.originalTransform = this.element.getAttribute('transform');
	}
};

Anim.prototype.endMoveHandler = function Anim_endMoveHandler(evt) {
	this.element.setAttribute('transform', Anim.FinalTransformForMove(evt.path));
};

SVGPathElement.prototype.$M = SVGPathElement.prototype.createSVGPathSegMovetoAbs;
SVGPathElement.prototype.$m = SVGPathElement.prototype.createSVGPathSegMovetoRel;
SVGPathElement.prototype.$L = SVGPathElement.prototype.createSVGPathSegLinetoAbs;
SVGPathElement.prototype.$l = SVGPathElement.prototype.createSVGPathSegLinetoRel;