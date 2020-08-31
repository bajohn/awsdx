import boto3
from smart_open import open as open


def main():
    # Change csv file to tsv to allow commas inside fields
    # as found in our datasets.

    with open('data/ams__header_2020__202008241500.csv') as fileIn:
        with open('data/ams__header_2020__202008241500.tsv', 'w+') as fileOut:
            ctr = 0
            for line in fileIn.readlines():
                inQuote = False
                newLine = ''
                for char in line:
                    if char == '"':
                        inQuote = not inQuote
                    elif char == ',' and not inQuote:
                        newLine += '\t'
                        continue
                    newLine += char
                ctr += 1
                fileOut.writelines([newLine])



if __name__ == '__main__':
    main()
