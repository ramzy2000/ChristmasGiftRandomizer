#ifndef GROUP_H
#define GROUP_H
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include "Person.h"
#include "DocumentTools.h"
//#define DEBUG

/// <summary>
/// Holds a dynamic list of Person data types and can perform operations on them.
/// Also can used to random match up people with other people.
/// </summary>
struct Group
{
	/// <summary>
	/// Holds the list of person objects in the current group.
	/// </summary>
	std::vector<Person*> personVec;

	/// <summary>
	/// File object used to open and access files.
	/// </summary>
	std::fstream file;

	/// <summary>
	/// Holds name of the text file group is reading from
	/// </summary>
	std::string fileSource;

	/// <summary>
	/// Default constructor
	/// </summary>
	Group();

	/// <summary>
	/// Construct a group with a diffrent fileSource name.
	/// </summary>
	Group(std::string file);

	~Group();

	/// <summary>
	/// Check if we can open the file.
	/// </summary>
	void openFile();

	/// <summary>
	/// Checks if file is empty and returns true or false.
	/// </summary>
	bool fileIsEmpty();

	/// <summary>
	/// checks to see if the text document has a even number of people.
	/// </summary>
	bool evenAmountOfPeople();

	void loadPersonData2();

	/// <summary>
	/// Load all the person data from the text file.
	/// </summary>
	void loadPersonData();

	/// <summary>
	/// Delete all of the person data.
	/// </summary>
	void deletePersonData();

	/// <summary>
	/// Displays the the groups IDs and matchedIDs along side the names.
	/// </summary>
	void DisplayGroupInfo();

	/// <summary>
	/// Display all the names in the group.
	/// </summary>
	void DisplayNames();
};

#endif //GROUP_H