#include "App.h"

App::App()
{
	AppLoop();
}

void App::AppLoop()
{
	while (true)
	{
		system("cls");
		appGroup = new Group; // Create group data
		if (CheckSuccess(*appGroup))
		{
			// calculating the random matchup
			appGroup->DisplayGroupInfo();
		}
		std::cout << "press y to reload or n to close." << std::endl;
		std::string input;
		std::cin >> input;
		if (input == "n")
		{
			delete appGroup;
			system("cls");
			break;
		}
		delete appGroup; // destroy Group data
	}
}

bool App::CheckSuccess(Group& groupObj)
{
	bool success = true;
	try
	{
		if (!groupObj.evenAmountOfPeople())
		{
			throw 99;
		}
		if (groupObj.fileIsEmpty())
		{
			throw 98;
		}
	}
	catch (int x)
	{
		success = false;
		switch (x)
		{
		case 99:
			std::cout << "error- " << x << " ODD::NUMBER::OF::NAMES" << '\a' << std::endl;
			break;
		case 98:
			std::cout << "error- " << x << " FILE::IS::EMPTY" << '\a' << std::endl;
		}
	}
	return success;
}