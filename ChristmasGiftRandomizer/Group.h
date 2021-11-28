#ifndef GROUP_H
#define GROUP_H
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include "Person.h"

struct Group
{
	std::vector<Person*> personVec;

	std::fstream file;

	std::string fileSource;

	Group();

	Group(std::string file);

	~Group();

	void DisplayGroupInfo();

	void openFile();

	void loadPersonData();

	void deletePersonData();

	void DisplayNames();
};

#endif //GROUP_H