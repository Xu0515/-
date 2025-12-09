#include "stdio.h"
#include "string.h"
#include "stdlib.h"

const int reglen = 94;    //每区(行)有 94 位(列)
const int font_width = 16;    // 单字点阵宽度(列数)
const int font_height = 16;    // 单字点阵高度(行数)
const int dotsize = 16 * 16 / 8;    //一个汉字点阵所占的字节数
const int subcode = 0xa0;    //内码与区、位码的差值

char* font_file_name = "chs16.fon";    // 点阵字库文件名
char str[] = "徐静仪";    //要显示点阵信息的汉字
char bindot[16 * 16 / 8] = { 0 };    //存储点阵信息的数组

void printcharbindot(char* bindot, int dotlen);

int main(int argc, char* argv[]) {
    FILE* fp = fopen(font_file_name, "rb");
    if (fp == NULL) {
        printf("无法打开字库文件 %s\n", font_file_name);
        system("pause");
        return -1;
    }

    int string_len = strlen(str); // 字符串长度（字节数）
    int char_count = string_len / 2; // 汉字个数（每个汉字2字节）

    for (int char_idx = 0; char_idx < char_count; char_idx++) {
        int i = char_idx * 2; // 每个汉字占2个字节

        // 计算区位码
        unsigned char regcode = (unsigned char)str[i] - subcode;
        unsigned char bitcode = (unsigned char)str[i + 1] - subcode;

        // 计算汉字在字库中的位置
        long offset = ((regcode - 1) * reglen + (bitcode - 1)) * dotsize;

        // 在字库文件中读取其点阵数据
        fseek(fp, offset, SEEK_SET);
        fread(bindot, sizeof(bindot), 1, fp);

        // 输出汉字和其点阵信息
        printf("汉字 '%c%c' 的点阵:\n", str[i], str[i + 1]);
        printcharbindot(bindot, dotsize);
        printf("\n");
    }

    fclose(fp);
    system("pause");
    return 0;
}

//按顺序输出点阵的每一位信息
void printcharbindot(char* bindot, int len) {
    int charnum = 0; //当前字节号
    int bitnum = 0; //已读取的位数
    int bitindex = 0; //当前位置
    int bitvalue; //当前位的值

    for (charnum = 0; charnum < len; ++charnum) {
        //从高到低顺次输出一个字节的每位信息
        for (bitindex = 7; bitindex >= 0; --bitindex) {
            //输出当前字节第bitindex位的值
            bitvalue = ((bindot[charnum] >> bitindex) & 0x1);
            printf("%c", bitvalue ? '■' : ' '); // 用方块和空格显示

            // 每16位换一行（显示一行）
            if ((++bitnum % 16) == 0) {
                printf("\n");
            }
        }
    }
}