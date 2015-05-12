var	fs = require("fs"),
//	async = require("async"),
	pg = require("pg");

function sum (array) {
	var out = 0;

	for (var i = 0; i < array.length; i += 1) {
		out += array[i];
	}

	return out;
}

/*
	Compute scores (featuring interpolated polynome) :
	scores : [[p1, p2, ...] , [mid1, mid2]]
*/
function compute_scores (pseudos, scores, data, game) {
	console.log(scores);
	
	var n = pseudos.length;
	var	points = Array(n);
	var rank = Array(n);

	for (var i = 0; i < n; ++i) {
		rank[i] = i;
	}
	
	rank.sort(function (a, b) { return scores[0][a] > scores[0][b] ? -1 : scores[0][a] < scores[0][b] ? 1 : 0; });

	for (var j = 0 ; j < n ; j++) {
		points[j] = n * 2 + -0.5 * Math.pow(rank[j], 3) + 3 * Math.pow(rank[j], 2) - 7.5 * rank[j] + 1;
	}

	return points;
}


function push_scores (pseudos, scores, game, cb) {
	if (process.env.ENV === "prod") {
		pg.connect(process.env.DATABASE_URL, function (err, client, done) {
			if (err) {
				console.log("Cannot connect");
				console.log(JSON.stringify(err));
			} else {
				console.log("Connected");
			}

			client.query("SELECT * from players", function (err, result) {
				var	data = {},
					points = [],
					results = [];

				if (err) {
					console.log("Erreur dans la récupération des données");
					console.log(JSON.stringify(err));
				} else {
					console.log("No error");
				}

				for (var j = 0; j < result.rows.length; j += 1) {
					data[result.rows[j].pseudo] = result.rows[j];
				}

				points = compute_scores(pseudos, scores, data, game);

				for (var i = 0; i < pseudos.length; i += 1) {
					results.push([pseudos[i], points[i], (scores[i] === Math.max.apply(this, scores)) ? 1 : 0]);
				}

				async.map(results, function (item, callback) {
					if (data[item[0]] === undefined) {
						client.query("INSERT INTO players(pseudo,score,won) VALUES ($1, $2, $3)" , item, function (err, res) {});
						console.log([item[0], item[1], 0]);
						callback(null, [item[0], item[1], 0]);
					} else {
						client.query("UPDATE players SET score=score+$2, total=total+1, won=won+$3 WHERE pseudo=$1", item, function (err, res) {
							console.log([item[0], item[1], data[item[0]].score]);
							callback(null, [item[0], item[1], data[item[0]].score]);
						});
					}
				}, function (err, results) {
					done();
					cb(results);
				});
			});
		});

	} else {
		fs.readFile("scores.json", function (err, raw) {
			var	data = JSON.parse(raw || "{}"),
				points = compute_scores(pseudos, scores, data, game),
				result = [];

			for (var i = 0; i < pseudos.length; i += 1) {
				data[pseudos[i]] = data[pseudos[i]] || {score: 0, won: 0, total: 0};

				result.push([pseudos[i], points[i], data[pseudos[i]].score]);

				data[pseudos[i]].score += points[i];
				data[pseudos[i]].total += 1;
				data[pseudos[i]].won += (scores[i] === Math.max.apply(this, scores)) ? 1 : 0;
			}

			fs.writeFile("scores.json", JSON.stringify(data), function () {});

			cb(result);
		});
	}
}

function get_scores (cb) {
	if (process.env.ENV === "prod") {
		pg.connect(process.env.DATABASE_URL, function (err, client, done) {
			client.query("SELECT * from players", function (err, result) {
				var data = {};

				for (var j = 0; j < result.rows.length; j += 1) {
					data[result.rows[j].pseudo] = result.rows[j];
				}

				cb.call(cb, data);
				done();
			});
		});

	} else {
		fs.readFile("scores.json", function (err, raw) {
			cb.call(cb, JSON.parse(raw || "{}"));
		});
	}
}

module.exports.push_scores = push_scores;
module.exports.get_scores = get_scores;
