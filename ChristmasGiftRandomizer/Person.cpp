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

void Person::DisplayInfo()
{
	std::cout << "name: " << name << std::endl;
	std::cout << "ID: " << ID << std::endl;
	std::cout << "matchedID: " << matchedID << std::endl;
}