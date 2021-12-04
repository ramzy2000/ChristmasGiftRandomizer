#include "Group.h"

std::string getStringToLeftOfComma(const std::string& str)
{
	std::string res = "";
	std::size_t sizeUpToComma = str.find(',');
	for (std::size_t i = 0; i < sizeUpToComma; i++)
	{
		char charBuffer = str.at(i);
		res = res + charBuffer;
	}
	return res;
}

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
	int personCounter = 0; // counter the amount of people in the group
	file.open(fileSource); // opens the file

	// Load person data into person vector as long as its
	// not the end of the file.
	while (!file.eof())
	{
		std::string line = ""; // line storage
		std::getline(file, line); // Line capture

		bool lineIsEmpty = line == "";
		bool lineHasComma = line.find(',') != std::string::npos;

		// if line is not empty load data.
		if(!lineIsEmpty)
		{
			// if line has a comma check whats to the left of it and store it.

			if (lineHasComma)
			{
				std::size_t sizeUpToComma = line.find(','); // get the element of the comma
				std::size_t sizeOfLine = line.size(); // get the size of the over all string

				// Replace line string with the data on the left of the comma.
				line = getStringToLeftOfComma(line);
			}

			// Load all of the person data without any flags
			Person* personPtr = new Person;
			personPtr->name = line;
			personCounter++;
			personPtr->ID = personCounter;
			personVec.push_back(personPtr);
		}
	}

	file.close(); // close the file.
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