#include "App.h"

App::App()
{
	AppLoop();
}

bool App::CheckSuccess(Group& groupObj)
{
	bool success = true;
	try
	{
		if (!groupObj.getRandomGiftMatch())
		{
			throw 99;
		}
	}
	catch (int x)
	{
		success = false;
		switch (x)
		{
		case 99:
			if (!groupObj.isEven)
			{
				std::cout << "ERROR::ODDNUMBER::OF::PEOPLE" << '\a' << std::endl;
			}
			std::cout << "error-99 FAILED::GET::RANDOM::GIFT::MATCH" << '\a' << std::endl;
			break;
		}
	}
	return success;
}

void App::AppLoop()
{
	while (true)
	{
		system("cls");
		Group appGroup("names.txt"); // create the group
		if (CheckSuccess(appGroup))
		{
			appGroup.DisplayNames();
		}
		std::cout << "press y to reload or n to close." << std::endl;
		std::string input;
		std::cin >> input;
		if (input == "n")
		{
			system("cls");
			break;
		}
	}
}