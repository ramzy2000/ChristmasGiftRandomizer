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
		bool success = true;
		try
		{
			if(!group.getRandomGiftMatch())
			{
				throw 100;
			}
			if(!group.isEven)
			{
				throw 99;
			}
		}
		catch(int x)
		{
			success = false;
			switch(x)
			{
			case 99:
				std::cout << "ERROR::ODDNUMBER::OF::PEOPLE" << '\a' << std::endl;
				break;
			case 100:
				std::cout << "ERROR::FAILED::GET::RANDOM::GIFT::MATCH" << '\a' << std::endl;
				break;
			}
		}
		if(success)
		{
			group.DisplayNames();
		}
		std::cout << "press y to try again or n to close." << std::endl;
		std::string input;
		std::cin >> input;
		if(input == "n")
		{
			system("cls");
			break;
		}
	}
	return 0;
}