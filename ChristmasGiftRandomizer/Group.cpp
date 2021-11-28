#include "Group.h"

Group::Group()
{
	fileSource = "names.txt";
	openFile();
	loadPersonData();
}

Group::Group(std::string file)
{
	fileSource = file;
	openFile();
	loadPersonData();
}

Group::~Group()
{
	deletePersonData();
}

void Group::DisplayGroupInfo()
{
	for (int i = 0; i < personVec.size(); i++)
	{
		personVec[i]->DisplayInfo();
	}
}

void Group::openFile()
{
	try
	{
		file.open(fileSource, std::fstream::in);
		if (!file.is_open())
		{
			throw 99;
		}
	}
	catch (int x)
	{
		switch (x)
		{
		case 99:
			std::cout << "ERROR::FILE::NOT::OPENED" << '\a' << std::endl;
			std::cout << "create a " << fileSource << " file to fix" << std::endl;
			system("pause");
			std::exit(-1);
			break;
		default:
			break;
		}
	}
	file.close();
}

void Group::loadPersonData()
{
	int counter = 0;
	file.open(fileSource);
	while (!file.eof())
	{
		std::string line = "";
		std::getline(file, line);
		Person* personPtr = new Person;
		personPtr->name = line;
		counter++;
		personPtr->ID = counter;
		personVec.push_back(personPtr);
	}
	file.close();
}

void Group::deletePersonData()
{
	int size = personVec.size();
	for (int i = 0; i < size; i++)
	{
		delete personVec[i];
	}
}

void Group::DisplayNames()
{
	for (Person* element : personVec)
	{
		std::cout << element->name << std::endl;
	}
}