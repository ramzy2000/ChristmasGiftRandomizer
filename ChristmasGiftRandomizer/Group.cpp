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

bool Group::fileIsEmpty()
{
	std::string content = "";
	file.open(fileSource);
	while (!file.eof())
	{
		std::string line = "";
		std::getline(file, line);
		content = line + content;
	}
	file.close();
	if (content == "")
	{
		return true;
	}
	else
	{
		return false;
	}
}

bool Group::evenAmountOfPeople()
{
	std::string content;
	int counter = 0;
	file.open(fileSource);
	while (!file.eof())
	{
		std::string line = "";
		std::getline(file, line);
		if(!(line == ""))
		{
			content = line + content;
			counter++;
		}
	}
	file.close();
	if (counter % 2 == 0)
	{
		return true;
	}
	else
	{
		if (content == "")
		{
			return true;
		}
		return false;
	}
}

void Group::loadPersonData()
{
	int counter = 0;
	file.open(fileSource);
	while (!file.eof())
	{
		std::string line = "";
		std::getline(file, line);
		if(!(line == ""))
		{
			Person* personPtr = new Person;
			personPtr->name = line;
			counter++;
			personPtr->ID = counter;
			personVec.push_back(personPtr);
		}
	}

	// every person flags themselves.
	for (int i = 0; i < counter; i++)
	{
		personVec[i]->flagSelfID(personVec[i]->ID);
	}
	file.close();
}

void Group::deletePersonData()
{
	int size = personVec.size();
	for (int i = 0; i < size; i++)
	{
		delete personVec[i];
		personVec[i] = nullptr;
	}
}

void Group::DisplayGroupInfo()
{
	if (!fileIsEmpty())
	{
		for (int i = 0; i < personVec.size(); i++)
		{
			personVec[i]->DisplayInfo();
		}
	}
}

void Group::DisplayNames()
{
	if (!fileIsEmpty())
	{
		for (Person* element : personVec)
		{
			std::cout << element->name << std::endl;
		}
	}
}