#ifndef PERSON_H
#define PERSON_H
#include <string>
#include <iostream>

/// <summary>
/// Holds all of the data pertaining to a person that will need to be 
/// identified with a string and a integer.
/// </summary>
class Person
{
public:
	/// <summary>
	/// Holds the name data of the person.
	/// </summary>
	std::string name;

	/// <summary>
	/// unique ID used in identifying a person besides the string name.
	/// </summary>
	int ID;

	/// <summary>
	/// used to match another ID (person) with the current person.
	/// </summary>
	int matchedID;

	/// <summary>
	/// Default constructor.
	/// </summary>
	Person();

	/// <summary>
	/// Construct a person with a name.
	/// </summary>
	/// <param name="n">The name of the person.</param>
	Person(std::string n);

	/// <summary>
	/// Displays all of the current person data info such as ID and matchedID with the string name.
	/// </summary>
	void DisplayInfo();

};

#endif // PERSON_H