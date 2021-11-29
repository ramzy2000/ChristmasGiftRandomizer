#ifndef GROUP_H
#define GROUP_H
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include "Person.h"

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

	bool fileIsEmpty = false;

	bool isEven = true;

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
	/// Displays the the groups IDs and matchedIDs along side the names.
	/// </summary>
	void DisplayGroupInfo();

	/// <summary>
	/// Check if we can open the file.
	/// </summary>
	void openFile();

	/// <summary>
	/// Load all the person data from the text file.
	/// </summary>
	void loadPersonData();

	/// <summary>
	/// Delete all of the person data.
	/// </summary>
	void deletePersonData();

	/// <summary>
	/// Display all the names in the group.
	/// </summary>
	void DisplayNames();

	bool getRandomGiftMatch();

	///void DisplayMatchNames()
	///{

	///}
};

#endif //GROUP_H