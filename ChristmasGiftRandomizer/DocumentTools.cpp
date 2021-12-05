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

std::string getStringToRightOfComma(const std::string& str)
{
	std::string res = "";
	std::size_t sizeUpToComma = str.find(',');
	std::size_t size = str.size();
	for (std::size_t i = sizeUpToComma+1; i < size; i++)
	{
		char charBuffer = str.at(i);
		res = res + charBuffer;
	}
	return res;
}

std::string getStringToRightOfCommaWs(const std::string& str)
{
	std::string res = "";
	std::size_t sizeUpToComma = str.find(',');
	std::size_t size = str.size();
	for (std::size_t i = sizeUpToComma+2; i < size; i++)
	{
		char charBuffer = str.at(i);
		res = res + charBuffer;
	}
	return res;
}