/// <summary>
/// I need a sytem that will load all of the string names in a text document and 
/// assign them a number acording to the count.
/// Each person will get a name a ID number and a matchedID that will later get assigned.
/// </summary>

#include "Group.h"


int main()
{
	Group group;
	//group.DisplayNames();
	for (int i = 0; i < group.personVec.size(); i++)
	{
		group.personVec[i]->DisplayInfo();
	}

	return 0;
}