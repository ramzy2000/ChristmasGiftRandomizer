#ifndef PERSON_H
#define PERSON_H
#include <string>
#include <iostream>

class Person
{
public:
	std::string name; // Holds the string name
	int ID; // holds the id that the person will get
	int matchedID; // holds the id of another person
	Person();
	Person(std::string n);

	void DisplayInfo();

};

#endif // PERSON_H