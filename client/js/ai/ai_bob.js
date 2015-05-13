/** 	Fonction appelée pour faire jouer l'IA
	retourne un couple de coordonnées, dans un tableau
	Arguments :
		- state : L'etat courant de la map, une matrice de taille*taille, chaque case vaut :
			* 0 : case vide
			* -1 : milieu
			* 1..4 : case prise par le joueur 1..4
		- scores : un tableau des scores, l'indice i contient le score du joueur i
		- played : la liste des segments déjà joués, sous la forme [cases, direction], avec cases la liste des cases contenues dans le segment, et direction la direction du segment :
			- 0 : ligne
			- 1 : colonne
			- 2 : diagonale Strasbourg Bordeaux
			- 3 : diagonale Brest Marseille
*/

function iaplay_bob (state, scores, played) {
	// Weight map
	var P_list = playable_cells (state);
	var weight_list = [];

	for (var i = 0 ; i < P_list.length ; i++) {
		weight_list[i] = weight(P_list[i][0], P_list[i][1], state, played);
	}

	// Maximum weight
	var m = 0;

	for (var j = 0 ; j < weight_list.length ; j++) {
		if (weight_list[j] > weight_list[m]) {
			m = j;
		}
	}

	return P_list[m];
}

function zoom_matrix (x, y, state) {
	var M = init_array(9);

	for (var i = 0 ; i < 9 ; i++) {
		for (var j = 0 ; j < 9 ; j++) {
			if (!out_of_bonds([x + i - 4, y + j - 4], state.length)) {
				M[i][j] = state[x + i - 4][y + j - 4];
			} else {
				M[i][j] = null;
			}
		}
	}

	return M;
}

function weight (x, y, state, played) {
	var W = 0;

	// Evaluate at center
	var local_matrix = zoom_matrix(x, y, state),
		check_double = [[0, 0, 0, 0], [0, 0, 0, 0]];

	var res;

	for (var r = 0 ; r < 4 ; r++) {
		for (var k = 0 ; k < 2 ; k++) {
			res = situations(state, local_matrix, x, y, r, k + 1, false);
			W += res[0];
			check_double[k][(2 * r) % 4] += res[1];
			check_double[k][(2 * r + 1) % 4] += res[2];
		}
		local_matrix = rot90(local_matrix, 9);
	}
	var d;

	for (var i = 0 ; i < 2 ; i++) {
		for (var j = 0 ; j < 4 ; j++) {
			d += check_double[i][j];
		}
	}

	if (d >= 1) {
		W += 100 * (d - 1);
	}

	/*
	#Find allowed cells
	flag = findCells(x,y)

	#Evaluate in each direction
	g.Grid.matrix[x,y] = 2
	m.refresh_scores()
	for i in range(4):
		if flag[i] != None:
			x0 = flag[i][0] ; y0 = flag[i][1]
			M = zoomMatrix(x0,y0)
			for r in range(4):
				w_dir1,c1,c2 = Situations(M,x0,y0,r,1,True)
				check_double1[(2*r)%4] += c1
				check_double1[(2*r+1)%4] += c2
				w_dir2,c1,c2 = Situations(M,x0,y0,r,2,True)
				check_double2[(2*r)%4] += c1
				check_double2[(2*r+1)%4] += c2
				W -= w_dir1+w_dir2
				M = np.rot90(M)
	g.Grid.matrix[x,y] = 0
	m.refresh_scores()
	d = sum(check_double1)+sum(check_double2)
	if d >= 1:
		W -= 50*(d-1)
		*/
	return W;
}

function rot90 (matrix, size) {
	var f = Math.floor(size / 2),
		c = Math.ceil(size / 2);

	for (var x = 0 ; x < f ; x++) {
		for (var y = 0 ; y < c ; y++) {
			temp = matrix[x][y];
			matrix[x][y] = matrix[y][size - 1 - x];
			matrix[y][size - 1 - x] = matrix[size - 1 - x][size - 1 - y];
			matrix[size - 1 - x][size - 1 - y] = matrix[size - 1 - y][x];
			matrix[size - 1 - y][x] = temp;
		}
	}

	return matrix;
}

function global_cell_pos (x, y, X, Y, r) {
	switch (r) {
		case 0:
			if (!out_of_bonds(X, Y)) {
				return [X, Y];
			} else { return false; }
		break;

		case 1:
			if (!out_of_bonds(x + Y - y, y - X + x)) {
				return [x + Y - y , y - X + x];
			} else { return false; }
		break;

		case 2:
			if (!out_of_bonds(2 * x - X, 2 * y - Y)) {
				return [2 * x - X, 2 * y - Y];
			} else { return false; }
		break;

		case 3:
			if (!out_of_bonds(x - Y + y, y + X - x)) {
				return [x - Y + y, y + X - x];
			} else { return false; }
		break;
	}
}

function check_gravity (state, x, y, X, Y, r) {
	pos = global_cell_pos(x, y, X, Y, r);

	if (pos && !out_of_bonds(pos, state.length)) {
		return checkplay(state, pos[0], pos[1]);
	} else {
		return true;
	}
}

function situations (state, M, x, y, r, id, virtual) { // Master Piece of art
	var W = 0;
	var double = [0, 0],
		pos;

	// Linear

	if (M[4][5] === id) {
		W += 4;	// oA

		if (M[4][6] === id) { // && checkCellScore(x,y,x,y+1,r,id,val=r%2)==0
			W += 10;	// oAA

			if (M[4][3] === id) {
				W += 97; // AoAA
				double[0] = 1;
			}

			if (M[4][7] === id && double[0] === 0) { // oAAA

				if (virtual) {
					W += 100;
					double[0] = 1;

				} else if (!virtual && M[4][8] !== id) {
					W += 100;
					double[0] = 1;
				}
			}

			if (M[4][3] !== id && M[4][7] !== id) {
				W -= 5;	// BoAAB
			}

			if (M[4][3] === 0 && check_gravity(state, x, y, x, y - 1, r)) {

				if (M[4][7] === 0) {

					if (check_gravity(state, x, y, x, y + 3, r)) {
						W += 80; // OoAAO
					} else {
						W += 20; // OoAAX
					}
				} else if (M[4][7] !== id && M[4][6] === id) {
					W += 30; // OoAAB
				}
			}
		} else if (M[4][6] === 0) {

			if (check_gravity(state, x, y, x, y + 2, r)) {
				W += 15; // oAO

				if (M[4][7] === 0 && check_gravity(state, x, y, x, y + 3, r)) {
					W += 5; // oAOO
				} else if (M[4][7] === id) {
					W += 30; // oAOA
				}
			} else {
				W += 5; // oAX

				if (M[4][7] === id) {
					W += 30;
				}
			}
		} else if (M[4][6] !== id && M[4][6] !== 0) {
			W += 3; // oAB
		}
	} else if (M[4][5] === 0 && M[4][6] === id && M[4][7] === id) {

		if (check_gravity(state, x, y, x, y + 1, r)) {
			W += 40; // oOAA
		} else {
			W += 30; // oXAA
		}
	}

	// Diagonal

	if (M[3][5] === id) {
		W += 4;	// oA

		if (M[2][6] === id) { // && checkCellScore(x,y,x,y+1,r,id,val=r%2)==0
			W += 10;	// oAA

			if (M[5][3] === id) {
				W += 97; // AoAA
				double[1] = 1;
			}

			if (M[1][7] === id && double[1] === 0) { // oAAA

				if (virtual) {
					W += 100;
					double[1] = 1;

				} else if (!virtual && M[0][8] !== id) {
					W += 100;
					double[1] = 1;
				}
			}

			if (M[5][3] !== id && M[1][7] !== id) {
				W -= 5;	// BoAAB
			}

			if (M[5][3] === 0 && check_gravity(state, x, y, x + 1, y - 1, r)) {

				if (M[1][7] === 0) {

					if (check_gravity(state, x, y, x - 3, y + 3, r)) {
						W += 80; // OoAAO
					} else {
						W += 20; // OoAAX
					}
				} else if (M[1][7] !== id && M[2][6] === id) {
					W += 30; // OoAAB
				}
			}
		} else if (M[2][6] === 0) {

			if (check_gravity(state, x, y, x, y + 2, r)) {
				W += 15; // oAO

				if (M[1][7] === 0 && check_gravity(state, x, y, x - 3, y + 3, r)) {
					W += 5; // oAOO
				} else if (M[1][7] === id) {
					W += 30; // oAOA
				}
			} else {
				W += 5; // oAX

				if (M[1][7] === id) {
					W += 30;
				}
			}
		} else if (M[2][6] !== id && M[2][6] !== 0) {
			W += 3; // oAB
		}
	} else if (M[3][5] === 0 && M[2][6] === id && M[1][7] === id) {

		if (check_gravity(state, x, y, x - 1, y + 1, r)) {
			W += 40; // oOAA
		} else {
			W += 30; // oXAA
		}
	}

	return [W, double[0], double[1]];
}
