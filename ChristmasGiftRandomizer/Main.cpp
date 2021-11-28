/// <summary>
/// I need a sytem that will load all of the string names in a text document and 
/// assign them a number acording to the count.
/// Each person will get a name a ID number and a matchedID that will later get assigned.
/// </summary>

#include <string>
#include "Group.h"


/// <summary>
/// Entry point of the application
/// </summary>
/// <returns>Exit code</returns>
int main()
{
	while (true)
	{
		system("cls");
		Group group;
		group.DisplayGroupInfo();
		std::cout << "press enter to try again." << std::endl;
		std::cin.get();
	}
	return 0;
}