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
		group.DisplayNames();
		std::cout << "press y to try again or n to close." << std::endl;
		std::string input;
		std::cin >> input;
		if(input == "n")
		{
			break;
		}
	}
	return 0;
}