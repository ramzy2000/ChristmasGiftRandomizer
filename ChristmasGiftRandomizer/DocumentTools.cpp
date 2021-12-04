#include "DocumentTools.h"

std::string getStringToLeftOfComma(const std::string& str)
{
	std::string res = "";
	std::size_t sizeUpToComma = str.find(',');
	for (std::size_t i = 0; i < sizeUpToComma; i++)
	{
		char charBuffer = str.at(i);
		res = res + charBuffer;
	}
	return res;
}