#ifndef APP_H
#define APP_H
#include "Group.h"

class App
{
public:
	Group appGroup;

	App();

	void AppLoop();

	bool CheckSuccess(Group& groupObj);
};

#endif // APP_H