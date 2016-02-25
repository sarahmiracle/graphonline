#include <iostream>
#include <cstdio>
#include <string>
using namespace std;
char a[3000];
int main()
{
	int n;
	cin>>n;
	freopen("input.txt","r",stdin);
	freopen("output.txt","w",stdout);
	int i=0,j,l;
	while(gets(a))
	{
		if(i%n==0) printf("[");
		if(i%n!=0) printf(",");
		l=strlen(a);
		printf("\"");
		for(j=0;j<l;j++) 
			if(a[j]!='\\') printf("%c",a[j]); 
			else printf("%c%c",a[j],a[j]);
		printf("\"");
		if(i%n==n-1) printf("]\n");
		i++;
	}
	if(i%n!=0) printf("]\n");
	return 0;
}