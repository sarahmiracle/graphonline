#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <map>
#include <unordered_map>
#include <string>
#include <cstring>
#include <queue>
#include <vector>
using namespace std;
//////error_finder
unordered_map<string, bool> exists;
//////////////////////////////////
int json_size;
string s1[2006], s2[2006];
char a[500000];
int adj[20][20];
int colors[20][20];
int V[20][20], V_rsize, V_csize;
int n;
int maxi(int a, int b){ return (a>b) ? a : b; }
int mini(int a, int b){ return (a<b) ? a : b; }
void parse_json()
{
	char ch;
	int l = strlen(a), gs = 0, cs = 0, i;
	for (i = 0; i<2006; i++) s1[i] = s2[i] = "";
	for (i = 0; i<l - 3; i++)
	{
		if (a[i] == '\"' && a[i + 2] == '\"')
		{
			ch = a[i + 1];
			if (ch != 'G' && ch != 'C') continue;
			for (i += 3;; i++) if (a[i] == '\"' || a[i] == '\'') break;
			for (i++; a[i] != '\"' && a[i] != '\''; i++)
			{
				if (ch == 'G') s1[gs] += a[i];
				else s2[cs] += a[i];
				if (a[i] == '\\' && a[i + 1] == '\\') i++;
			}
			if (ch == 'G') gs++;
			else cs++;
		}
	}
	json_size = gs;
}
void decrypt_graph(string G)
{
	int i, j, tmp, i1 = 1, p = 1;
	n = G[0] - 63;
	for (j = 1; j < n; j++)
	for (i = 0; i < j; i++)
	{
		if (--i1 == 0)
		{
			i1 = 6;
			tmp = G[p] - 63;
			p++;
		}
		if (tmp & 32)
		{
			adj[i][j] = 1;
			adj[j][i] = 1;
		}
		tmp <<= 1;
	}
}
void adj_to_bipartite()
{
	vector<int> V1[3];
	int color[20], i, j, tmp;
	for (i = 0; i<20; i++) color[i] = 0;
	queue<int> Q;
	Q.push(0);
	V1[1].push_back(0);
	color[0] = 1;
	while (!Q.empty())
	{
		tmp = Q.front();
		Q.pop();
		for (j = 0; j<n; j++)
		{
			if (adj[tmp][j] && !color[j])
			{
				Q.push(j);
				color[j] = color[tmp] ^ 3;
				V1[color[j]].push_back(j);
			}
		}
	}
	for (i = 0; i<V1[1].size(); i++)
	for (j = 0; j<V1[2].size(); j++)
		V[i][j] = adj[V1[1][i]][V1[2][j]];
	V_rsize = V1[1].size();
	V_csize = V1[2].size();
}
void decrypt_colors(string C)
{
	int i, j, p = 0;
	for (i = 0; i<V_rsize; i++)
	for (j = 0; j<V_csize; j++)
	if (V[i][j])
	{
		colors[i][j] = C[p] - 63;
		p++;
	}
}
bool check_colors()
{
	int i, j, mi, ma, t;
	bool mark[32];
	for (i = 0; i<V_rsize; i++)
	{
		for (j = 0; j<32; j++) mark[j] = false;
		ma = -1; mi = 100, t = 0;
		for (j = 0; j<V_csize; j++)
		{
			if (colors[i][j] == 0) continue;
			t++;
			if (mark[colors[i][j]]) return false;
			mark[colors[i][j]] = true;
			ma = maxi(ma, colors[i][j]);
			mi = mini(mi, colors[i][j]);
		}
		if (ma - mi + 1 != t) return false;
	}
	for (i = 0; i<V_csize; i++)
	{
		for (j = 0; j<32; j++) mark[j] = false;
		ma = -1; mi = 100, t = 0;
		for (j = 0; j<V_rsize; j++)
		{
			if (colors[j][i] == 0) continue;
			t++;
			if (mark[colors[j][i]]) return false;
			mark[colors[j][i]] = true;
			ma = maxi(ma, colors[j][i]);
			mi = mini(mi, colors[j][i]);
		}
		if (ma - mi + 1 != t) return false;
	}
	return true;
}
void clear_graphandcolors()
{
	int i, j;
	for (i = 0; i<20; i++)
	for (j = 0; j<20; j++)
		V[i][j] = adj[i][j] = colors[i][j] = 0;
}
int main()
{
	freopen("results", "r", stdin);
	freopen("wrongs", "w", stdout);
	int i, tox = 1;;
	while (gets(a))
	{
		parse_json();
		for (i = 0; i<json_size; i++)
		{
			if (exists[s1[i]]) cout << "krknutyun - " << s1[i] << endl;
			exists[s1[i]] = true;
			decrypt_graph(s1[i]);
			adj_to_bipartite();
			decrypt_colors(s2[i]);
			if (!check_colors()) cout << "wrong answer : " << s1[i] << "  -  " << s2[i] << endl;
			clear_graphandcolors();
		}
		cerr << tox++ << endl;
	}

	//////////////////////////////////////////////errors_finder
	freopen("graphs", "r", stdin);
	freopen("errors", "w", stdout);
	string tmp;
	int l;
	while (gets(a))
	{
		tmp = "";
		l = strlen(a);
		for (i = 0; i<l; i++) tmp += a[i];
		if (exists.find(tmp) == exists.end())
		{
			//cout << tmp << endl;
			printf("%s\n", a);
		}
		//		if(!exists[tmp]) cout<<tmp<<endl;
	}
	return 0;
}