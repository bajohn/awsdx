import boto3


def handler(event, context):
    client = boto3.client('dataexchange')
    print('Good to go!')
