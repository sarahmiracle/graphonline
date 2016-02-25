// with timeout
var program = function(data) {
    var c_decrypt = function (nerkum) {
        if (nerkum == false) return "false";
        var i, j, s = "";
        for (i = 0; i < nerkum.length; i++)
            for (j = 0; j < nerkum[i].length; j++)
                if (nerkum[i][j])
                    s += String.fromCharCode(nerkum[i][j] + 64);
        return s;
    };
    var g6_decrypt = function (graph_g6) {
        var tmp = graph_g6.charCodeAt(0);
        var n = tmp - 63;
        var adj = new Array(n), i, j, i1 = 1, j1 = 32, p = 1;
        for (i = 0; i < n; i++) adj[i] = new Array(n);
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) adj[i][j] = 0;
        for (j = 1; j < n; j++)
            for (i = 0; i < j; i++) {
                if (--i1 == 0) {
                    i1 = 6;
                    tmp = graph_g6.charCodeAt(p) - 63;
                    p++;
                }
                if (tmp & j1) {
                    adj[i][j] = 1;
                    adj[j][i] = 1;
                }
                tmp <<= 1;
            }
        return adj;
    };
    var bipartite_matrix = function (graph) {
        var adjacency = g6_decrypt(graph);
        var n = adjacency.length;
        var V1 = [], V2 = [];
        var Q = [], color = [], j, i, tmp;
        Q.push(0);
        V1.push(0);
        color[0] = 1;
        while (Q.length > 0) {
            tmp = Q.shift();
            for (j = 0; j < n; j++)
                if (adjacency[tmp][j] && !color[j]) {
                    Q.push(j);
                    color[j] = color[tmp] ^ 3;
                    if (color[j] == 1) V1.push(j);
                    else V2.push(j);
                }
        }
        var b_matrix = new Array(V1.length);
        for (i = 0; i < V1.length; i++) b_matrix[i] = new Array(V2.length);
        for (i = 0; i < V1.length; i++)
            for (j = 0; j < V2.length; j++)
                b_matrix[i][j] = adjacency[V1[i]][V2[j]];
        return b_matrix;
    };

    var colorBipartiteGraph = function (b, m, n, timelimit) {
        var E;
        var arrCol;
        var arrRow;

        var degRow;
        var degCol;

        var i, j, k; //shochikner


        ///////timelimit
        var iter = 0, finish = false;


        var setColor = function (row, col, x /*guin@*/) {
            E[row][col] = x;
            for (i = row + 1; i < m; i++)
                arrCol[i][col] |= 1 << x;
            for (j = col + 1; j < n; j++)
                arrRow[row][j] |= 1 << x;
        };
        var removeColor = function (row, col) {
            var x = E[row][col];
            for (i = row + 1; i < m; i++)
                arrCol[i][col] &= ~(1 << x);
            for (j = col + 1; j < n; j++)
                arrRow[row][j] &= ~(1 << x);
        };

        var maxBit = function (n) {
            //ete 1 vapshe chka, x@ undefined a ..... baic misht mi ban klini eli!
            var sh = 0, x;
            while (n != 0) {
                if (n & 1)
                    x = sh;
                sh++;
                n >>= 1;
            }
            return x;
        };
        var minBit = function (n) {
            if (n == 0) {
                alert("1 vapshe chka!!!!!");
                return -1;
            }

            var x = 0;
            while ((n & 1) == 0) {
                n >>= 1;
                x++;
            }
            return x;
        };

        var nextNumbers = function (row, col) {
            var TAB = [], TABcount;
            //srand(time(NULL));
            //if(rand()%100<5)
            //printMatrix();
            var downLimit = 1;

            var isArrCol = arrCol[row][col] != 0;
            var isArrRow = arrRow[row][col] != 0;

            var x;
            if (isArrCol) {
                x = maxBit(arrCol[row][col]) - degCol[col] + 1;
                if (downLimit < x)
                    downLimit = x;
            }

            if (isArrRow) {
                x = maxBit(arrRow[row][col]) - degRow[row] + 1;
                if (downLimit < x)
                    downLimit = x;
            }

            var upLimit = 100;
            if (isArrCol)
                upLimit = minBit(arrCol[row][col]) + degCol[col] - 1;
            if (isArrRow) {
                x = minBit(arrRow[row][col]) + degRow[row] - 1;
                if (upLimit > x)
                    upLimit = x;
            }

            var bits = arrRow[row][col] | arrCol[row][col];	//bolor 1er@ havaqecinq
            bits >>= downLimit;	//skzbi DOWNLIMIT hat@ hetaqrqir chi

            for (i = downLimit; i <= upLimit; i++) {
                if (!(bits & 1))
                    TAB.push(i);
                bits >>= 1;
            }

            shuffle(TAB);

            return TAB;
        };

        var recurse = function (ii, jj) {
            //timelimit
            iter++;
            if (iter > timelimit) {
                finish = true;
                return false;
            }

            if (jj == n)
                return true;	//verj
            if (b[ii][jj] == 0)
                return recurse(ii == m - 1 ? 0 : ii + 1, jj + (ii == m - 1));	//datark vandaki vra

            var TAB = nextNumbers(ii, jj);
            TAB = shuffle(TAB);
            var TABcount = TAB.length;

            var c = 0;
            var B;
            do {
                if (c >= TABcount)
                    return false;
                setColor(ii, jj, TAB[c++]);
                B = recurse(ii == m - 1 ? 0 : ii + 1, jj + (ii == m - 1));

                if (finish) return false; // timelimit

                if (!B)
                    removeColor(ii, jj);
            } while (!B);

            return true;
        };

        var shuffle = function (o) { //v1.0
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        };

        var findColoring = function (corner) {
            corner = corner || 1;
            // hashvenq degree-ner@
            degRow = [];
            degCol = [];
            for (i = 0; i < m; i++)
                degRow[i] = 0;
            for (j = 0; j < n; j++)
                degCol[j] = 0;

            E = [];
            arrRow = [];
            arrCol = [];
            for (i = 0; i < m; i++) {
                E[i] = [];
                arrCol[i] = [];
                arrRow[i] = [];
                for (j = 0; j < n; j++) {
                    if (b[i][j]) {
                        arrCol[i][j] = 0;
                        arrRow[i][j] = 0;
                        degRow[i]++;
                        degCol[j]++;
                    }
                    E[i][j] = 0;
                }
            }

            //ankiunin@ grenq 1!
            setColor(0, 0, corner);

            //	printMatrix();
            var B = recurse(1, 0);

            if (finish) return false; // timelimit

            if (!B) {
                if (corner == 5) {
                    return false;
                }
                return findColoring(corner + 1);
            }
            return E;
        };

        return findColoring(15);
    };

    function Run(d) {
//        console.log(d);
        var i, s, m, nerkum, ret = [], pat = {}, timelimit, timeinter = 1000;
        for (i = 0; i < d.length; i++) {
            s = d[i];
            postMessage(s);/////////////////////////////////tell the graph to client
            m = bipartite_matrix(s);
            nerkum = false;
            timelimit = timeinter;
            while (nerkum == false) { /// piti lini while
                timelimit *= 1.1;
                if(timelimit>100000000) break;
                for (var j = 0; j < 1; j++) {
                    nerkum = colorBipartiteGraph(m, m.length, m[0].length, timelimit);
                    if (nerkum != false) break;
                }
//                console.log(timelimit);
            }
            /*pat.G=s;
             pat.C=c_decrypt(nerkum);*/
            if (nerkum != false) {
                ret.push({"G": s, "C": c_decrypt(nerkum)});
                postMessage("C");//////////////add one to number of colored graphs
//                postMessage({info: 'tmpres', value: ret});///////////////////////////////////////////////////////
            }
        }
        //    console.log(JSON.stringify(ret));
        return ret;
    }
    return Run(data);
};

onmessage = function (oEvent) {
    postMessage(program(oEvent.data));
};