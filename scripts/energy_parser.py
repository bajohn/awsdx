import boto3
from smart_open import open as open

def main():
    #with open('data/energy_data.csv') as f:
    with open('s3://awsdx-data-bucket/energy_data/data_20200623') as f:
        ctr = 0
        for line in f:
            print(line)
            ctr += 1
            if ctr > 10:
                break


if __name__ == '__main__':
    main()
