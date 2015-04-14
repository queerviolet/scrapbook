"use strict";

var Twenty48 = (function() {
  function Tile(value) {
    this.value = value;
    this.parents = Array.prototype.slice.call(arguments, 1);
  }

  Tile.prototype.toString = function() { 
    return this.value;
  };

  Tile.prototype.canMerge = function(other) {
    return this.value === other.value;
  }

  Tile.prototype.merged = function(other) {
    if (this.value !== other.value) { return null; }
    return new Tile(2 * this.value, this, other);
  };

  function Game(size, board) {
    this.size = size || 4;
    if (!board) {
      this.board = startingBoard(this.size);
    } else {
      this.board = copyAry2d(board);
    }
  }

  Game.prototype.toString = function() {
    return this.board.map(function(row) {
      return row.map(function(val) {
        return val? val : ' ';
      }).join(' | ');
    }).join('\n');
  };

  function startingBoard(size) {
    return spawn(newAry2d(size, size), 2);
  }

  function spawn(ary, count, width) {
    count = count || 1;
    width = width || ary.length;
    var open = [];
    var i = ary.length;
    while (--i >= 0) {
      var j = width;
      while (--j >= 0) {
        if (!ary[i][j]) {
          open.push({row: i, col: j});
        }
      }
    }
    while (open.length > 0 && count) {
      var num = Math.random() < 0.75? 2 : 4;
      // TODO: I think using Math.round here introduces some kind of bias.
      var idx = Math.round((open.length - 1) * Math.random());
      var coord = open[idx];
      ary[coord.row][coord.col] = new Tile(num);
      open.splice(idx, 1);
      --count;
    }
    return ary;
  }

  function newAry2d(w, h) {
    var dst = new Array(h);
    var i = w;
    while (--i >= 0) {
      dst[i] = new Array(w);
    }
    return dst;
  }

  function copyAry2d(src, dst) {
    var dst = dst || new Array(src.length);
    var i = src.length;
    while (--i >= 0) {
      dst[i] = src[i].slice();
    }
    return dst;
  }

  // [[1, 2],    [[2, 1],
  //  [3, 4]] ->  [4, 3]]
  function horizReflectAry2d(src, dst) {
    var dst = dst || new Array(src.length);
    var i = src.length; while (--i >= 0) {
      dst[i] = src[i].slice().reverse();
    }
    return dst;
  }

  // flips about the diagonal.
  // [[1, 2],    [[1, 3],
  //  [3, 4]] ->  [2, 4]]
  function transposeAry2d(src, dst) {
    var srcRows = src.length;
    var srcCols = src[0].length;    
    var dst = dst || new Array(srcCols);
    var i = srcCols; while (--i >= 0) {
      dst[i] = new Array(srcRows);
      var j = srcRows; while (--j >= 0) {
        dst[i][j] = src[j][i];
      }
    }
    return dst;
  }

  var transforms = {
    left: {
      apply: copyAry2d,
      unapply: copyAry2d,
    },
    right: {
      apply: horizReflectAry2d,
      unapply: horizReflectAry2d,
    },
    up: {
      apply: transposeAry2d,
      unapply: transposeAry2d,
    },
    down: {
      apply: function(src) {
        return horizReflectAry2d(transposeAry2d(src));
      },
      unapply: function(src) {
        return transposeAry2d(horizReflectAry2d(src));
      },
    },
  };

  // Falls left.
  function fall(ary) {
    var rowSz = ary[0].length;
    var zeroes = new Array(rowSz);
    var i = rowSz;
    while (--i >= 0) {
      zeroes[i] = 0;
    }

    i = ary.length;    
    while (--i >= 0) {
      ary[i] = ary[i].filter(function(x) { return x; });
    }
    return ary;
  }

  function coalesce(ary) {
    var r = ary.length;
    while (--r >= 0) {
      var prev = null;
      for (var c = 0; c < ary[r].length; ++c) {
        if (prev && prev.canMerge(ary[r][c])) {
          console.log('merging');
          ary[r].splice(c - 1, 2, prev.merged(ary[r][c]));
          prev = null;
        } else {
          prev = ary[r][c];
        }
      }
    }
  }

  function pad(ary, width, height) {
    var zeroes = new Array(width);
    var i = zeroes.length;
    while (--i >= 0) {
      zeroes[i] = null;
    }
    i = height;
    while (--i >= 0) {
      if (ary[i]) {
        ary[i] = ary[i].concat(zeroes).slice(0, width);
      } else {
        ary[i] = zeroes.slice();
      }
    }
    return ary;
  }

  for (var t in transforms) {
    Game.prototype[t] = (function(t) {
      return function() {
        var board = transforms[t].apply(this.board);
        fall(board);
        coalesce(board);
        pad(board, this.size, this.size);
        spawn(board);
        this.board = transforms[t].unapply(board);
      }
    })(t);
  }

  var elProto = Object.create(HTMLElement.prototype);

  elProto.createdCallback = function() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.game = new Game(4);
    var r = 4; while (--r >= 0) {
      var c = 4; while (--c >= 0) {
        var bgTile = document.createElement('twenty-48-tile');
        bgTile.classList.add('bg');
        bgTile.dataset.dead = true;
        moveTile({node: bgTile, parents: []}, r, c);
        this.appendChild(bgTile);
      }
    }
  };

  elProto.attachedCallback = function() {
    window.addEventListener('keydown', this.onKeyDown);
    this.update();
  };

  elProto.detachedCallback = function() {
    window.removeEventListener('keydown', this.onKeyDown);
  };

  elProto.onKeyDown = function(evt) {
    console.log(evt);
    var move = evt.keyIdentifier.toLowerCase();
    if (move in this.game) {
      this.game[move]();
    }
    this.update();
  };

  function moveTile(tile, r, c) {
    if (tile.node) {
      tile.node.dataset.row = r;
      tile.node.dataset.col = c;
      var i = tile.parents.length;
      while (--i >= 0) {
        moveTile(tile.parents[i], r, c);
      }      
    }
  }

  elProto.update = function() {
    var tiles = this.querySelectorAll('twenty-48-tile');
    var i = tiles.length;
    while (--i >= 0) {
      tiles[i].dataset.dead = 'true';
    }

    var r = this.game.board.length;
    while (--r >= 0) {
      var c = this.game.board[r].length;
      while (--c >= 0) {
        var tile = this.game.board[r][c];
        if (tile) {
          if (!tile.node) {
            tile.node = document.createElement('twenty-48-tile');
            tile.node.textContent = tile.value;
            this.appendChild(tile.node);
          }
          moveTile(tile, r, c);
          delete tile.node.dataset.dead;
        }
      }
    }
  };

  return {
    Game: Game,
    Element: document.registerElement('twenty-48', {prototype: elProto}),
  };
})();

