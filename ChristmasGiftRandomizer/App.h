#ifndef APP_H
#define APP_H
#include "Group.h"

class App
{
public:

	Group appGroup;

	App();

	bool CheckSuccess(Group& groupObj);

	void AppLoop();
};

#endif // APP_H