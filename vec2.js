
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
	},
	neg: {
		enumerable: false,
		get: function() {
			return [-this.x, -this.y];
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

Array.prototype.lerp2 = function lerp2(to, by) {
	return this.sum2(to.sum2(this.neg).scale2([by, by]));
};

(function(){

	/**
	 * Decimal adjustment of a number.
	 *
	 * @param	{String}	type	The type of adjustment.
	 * @param	{Number}	value	The number.
	 * @param	{Integer}	exp		The exponent (the 10 logarithm of the adjustment base).
	 * @returns	{Number}			The adjusted value.
	 */
	function decimalAdjust(type, value, exp) {
		// If the exp is undefined or zero...
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		// If the value is not a number or the exp is not an integer...
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		// Shift
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		// Shift back
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	// Decimal round
	if (!Math.round10) {
		Math.round10 = function(value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	// Decimal floor
	if (!Math.floor10) {
		Math.floor10 = function(value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	// Decimal ceil
	if (!Math.ceil10) {
		Math.ceil10 = function(value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}

})();