#include "Group.h"

Group::Group()
{
	fileSource = "names.txt";
	openFile();
	loadPersonData();
	loadFlagData();
}

Group::Group(std::string file)
{
	fileSource = file;
	openFile();
	loadPersonData();
	loadFlagData();
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

void Group::loadFlagData()
{
	// open the file
	int amountOfLines = 0; // count the amount of lines
	file.open(fileSource); // open file

	// itterate through the whole file.
	while (!file.eof())
	{
		std::string line = "";// create string storage for the current line.
		std::getline(file, line); // fill the storage
		bool lineIsEmpty = line == "";
		bool lineHasComma = line.find(',') != std::string::npos;
		bool lineHasSpace = line.find(' ') != std::string::npos;

		// if the line is not empty then we want to check for perameters
		if (!lineIsEmpty)
		{
			// if line has comma and space
			if (lineHasComma && lineHasSpace)
			{
				// ignore the right side of the comma.
				// store it in the line string
				line = getStringToRightOfCommaWs(line);

				// load the current person's sting vector with a name flag.
				personVec[amountOfLines]->strVector.push_back(line);
			}
			// if the line only has a comma.
			else
			{
				if (lineHasComma)
				{
					line = getStringToRightOfComma(line);
					personVec[amountOfLines]->strVector.push_back(line);
				}
			}
			amountOfLines++;
		}
	}

	// close the file
	file.close();
}

void Group::checkFlagsAgainstPersonVecAndIDFlag()
{
	// itteraing along personVec
	for (Person* person : personVec)
	{
		// get the size of the current string vector of the current person.
		std::size_t stringVectorSize = person->strVector.size();

		// itterate along current string vector.
		for (std::size_t i = 0; i < stringVectorSize; i++)
		{
#ifdef DEBUG
			// if the current person name is equal to the current itterated string.
			if (person->name == person->strVector[i])
			{
				person->ID
			}
#endif //DEBUG
		}
	}
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