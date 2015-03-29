function Game(size, update){
	'use strict';
	this.state = [];
	for(var i = 0; i < size; i += 1){
		this.state[i] = Array(size);
		for (var j = 0; j < size; j += 1){
			this.state[i][j] = 0;
		}
	}
	this.state[Math.floor(size/2)][Math.floor(size/2)] = -1;

	this.update_cb = update;
	this.update_cb.call(this, this.state, this.scores(), false);

	this.size = size;
}

Game.prototype.checkplay = function (x,y){
	'use strict';
	var tries = [0,0,0,0];
	if (this.state[x][y] != 0){
		return false;
	}

	if (x==0 || y==0 || x==this.size-1 || y==this.size-1){
		return true;
	}

	for (var i in this.state){
		for (var j in this.state[i]){
			if (x == i && y!= j && this.state[i][j] == 0){
				tries[Math.floor(y > j)] = 1;
			} else if (x != i && y == j && this.state[i][j] == 0){
				tries[2+Math.floor(x > i)] = 1;
			}
		}
	}
	if (tries.indexOf(0) != -1){
		return true;
	} else {
		return false;
	}
};

Game.prototype.play = function (player, x,y, overwrite){
	'use strict';
	if (player > 2 || player < 1){
		return false;
	}
	if (player == this.oldplayer && !overwrite){
		return false;
	}
	if (this.checkplay(x,y)){
		this.state[x][y] = player;
		this.update_cb.call(this, this.state, this.scores(), this.isFinished());
		this.oldplayer = player;
		return true;
	} else {
		this.update_cb.call(this, this.state, this.scores(), this.isFinished());
		return false;
	}
};

Game.prototype.isFinished = function(){
	'use strict';
	for (var i in this.state){
		if (this.state[i].indexOf(0) != -1){
			return false;
		}
	}
	return true;
};


function next(x,y){
	'use strict';
	return (Math.max(Math.abs(x[0]-y[0]),Math.abs(x[1]-y[1])) <= 1);
}

Game.prototype.scores = function(){
	'use strict';
	var score = [0,0],
	count = [[],[],[],[]];

	for (var i in this.state){
		for (var j in this.state[i]){
			if (this.state[i][j] == 0){
				continue;
			}
			for(var k  = 0; k < count.length; k += 1){
				var l = 0;
				switch(k){
					case 0:
						l = i;
					break;
					case 1:
						l = j;
					break;
					case 2:
				        l = i+j;
					break;
					case 3:
					        l = i-j+this.size;
					break;
				}
				if (count[k][l] === undefined || count[k][l][0] !== this.state[i][j]){
					count[k][l] = [this.state[i][j], 1];
				} else if (count[k][l][0] === this.state[i][j] || (this.isFinished() && this.state[i][j] === -1)){
					count[k][l][1] += 1;
					if (count[k][l][1] >= 4){
						score[count[k][l][0]-1] += 1;
						count[k][l][1] = 0;
					}
				}
			}
		}
	}
	return score;
};


try {
module.exports.Game = Game;
} catch (ignore) {}
