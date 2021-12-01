#include "Person.h"

Person::Person()
{
	name = "empty";
	ID = 0;
	matchedID = 0;
}

Person::Person(std::string n)
{
	name = n;
	ID = 0;
	matchedID = 0;
}

void Person::flagIDs(Person& personObj)
{
	personObj.flagsVector.push_back(ID);
	flagsVector.push_back(personObj.ID);
}

void Person::flagSelfID(int id)
{
	flagsVector.push_back(id);
}

void Person::DisplayInfo()
{
	std::cout << "name: " << name << std::endl;
	std::cout << "ID: " << ID << std::endl;
	std::cout << "matchedID: " << matchedID << std::endl;
	std::cout << "flagedIDs: ";
	DisplayFlags();
	std::cout << std::endl;
}

void Person::DisplayFlags()
{
	int size = flagsVector.size();
	if (!size == 0)
	{
		for (int i = 0; i < size; i++)
		{
			std::cout << flagsVector[i];
			if (!(i == size-1))
			{
				std::cout << " ,";
			}
		}
	}
	else
	{
		std::cout << "none";
	}
}