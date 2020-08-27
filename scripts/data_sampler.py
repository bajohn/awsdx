import boto3
from smart_open import open as open


def main():
    # with open('data/energy_data.csv') as f:
    # with open('s3://awsdx-data-bucket/cbp/cbpComplete') as f:

    with open('data/ams__header_2020__202008241500.csv') as f:
        ctr = 0
        for line in f.readlines():
            ctr += 1
            print(line)
            print(ctr)
            if ctr % 10000 == 0:
                break


if __name__ == '__main__':
    main()
