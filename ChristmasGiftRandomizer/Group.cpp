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
	if (!fileIsEmpty)
	{
		for (int i = 0; i < personVec.size(); i++)
		{
			personVec[i]->DisplayInfo();
		}
	}
	else
	{
		std::cout << fileSource << " is empty." << std::endl;
	}
}

void Group::openFile()
{
	std::ofstream* fileTemp = new std::ofstream;
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
			std::cout << "Failed to open " << fileSource << std::endl;
			std::cout << "Creating " << fileSource << std::endl;
			file.close();
			fileTemp->open(fileSource, std::ios::out);
			fileTemp->close();
			break;
		default:
			break;
		}
	}
	delete fileTemp;
	file.close();
}

void Group::loadPersonData()
{
	int counter = 0;
	std::string content;
	file.open(fileSource);
	while (!file.eof())
	{
		std::string line = "";
		std::getline(file, line);
		content = line + content;
		Person* personPtr = new Person;
		personPtr->name = line;
		counter++;
		personPtr->ID = counter;
		personVec.push_back(personPtr);
	}
	if (content == "")
	{
		fileIsEmpty = true;
	}
	else
	{
		fileIsEmpty = false;
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
	if (!fileIsEmpty)
	{
		for (Person* element : personVec)
		{
			std::cout << element->name << std::endl;
		}
	}
	else
	{
		std::cout << fileSource << " is empty." << std::endl;
	}
}

bool Group::getRandomGiftMatch()
{
	bool success = true;
	if((personVec.size() % 2) == 0 )
	{
		isEven = true;
	}
	else
	{
		isEven = false;
	}

	if(!isEven)
	{
		success = false;
	}

	return success;
}