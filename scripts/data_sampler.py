import boto3
from smart_open import open as open


def main():
    # with open('data/energy_data.csv') as f:
    # with open('s3://awsdx-data-bucket/cbp/cbpComplete') as f:
    with open('data/weekly.csv') as f:
        ctr = 0
        for line in f.readlines():
            ctr += 1
            if ctr % 10000 == 0:
                print(line)
                print(ctr)


if __name__ == '__main__':
    main()
