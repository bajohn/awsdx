import boto3
import gzip
import time
from smart_open import open as open

'''
Move AWS Data Exchange data to S3.
Usage:
Set the following parameters
DATA_SET_ID: the Data Set ID from AWS Data Exchange
S3_OUT_PREFIX: beginning of S3 key, should end with '/'
BUCKET: S3 Bucket

Run from CLI using:
$ pipenv run python scripts/data_agg.py
'''


def main():

    DATA_SET_ID = 'a7705ab9657df42a51f8b8d598de72d0'
    S3_OUT_PREFIX = 'cbp/'  # 'securities_data/'

    BUCKET = 'awsdx-data-bucket'
    WAIT_SECS = 10
    MOVE_ONE = True  # Only move the latest revision to S3.

    dxClient = boto3.client('dataexchange')

    revisions = data_source_revisions(dxClient, DATA_SET_ID)
    if MOVE_ONE:
        revisions = revisions[:1]
        print(revisions)

    print(f'Number of jobs expected: {len(revisions)}')

    jobObjs = [dxS3Jobs(revision, BUCKET, S3_OUT_PREFIX, dxClient)
               for revision in revisions]

    awaitJobs(jobObjs, dxClient, WAIT_SECS)

    uncompressFiles(jobObjs)
    print('Done')

    return 'Done'


def uncompressFiles(jobObjs):
    for jobObj in jobObjs:
        unzip_file(jobObj['fileLocation'])


def awaitJobs(jobObjs, dxClient, waitSecs):
    for jobObj in jobObjs:
        while not jobComplete(jobObj['jobId'], dxClient):
            time.sleep(waitSecs)

# data exchange object -> s3


def dxS3Jobs(dxObj, s3Bucket, s3Prefix, dxClient):
    name = dxObj['Comment']
    revisionId = dxObj['Id']
    dataSetId = dxObj['DataSetId']

    revisionAssets = dxClient.list_revision_assets(
        DataSetId=dataSetId,
        RevisionId=revisionId
    )

    assetid = revisionAssets['Assets'][0]['Id']
    s3Key = s3Prefix + name
    createRequest = dict(
        ExportAssetsToS3=dict(
            DataSetId=dataSetId,
            RevisionId=revisionId,
            AssetDestinations=[
                dict(
                    AssetId=assetid,
                    Bucket=s3Bucket,
                    Key=s3Key,
                )
            ]
        )
    )

    resp = dxClient.create_job(
        Details=createRequest, Type='EXPORT_ASSETS_TO_S3')

    jobId = resp['Id']
    dxClient.start_job(
        JobId=jobId
    )

    fileLocation = f's3://{s3Bucket}/{s3Key}'
    print(f'Job created for {fileLocation}')
    return dict(
        fileLocation=fileLocation,
        jobId=jobId
    )


def jobComplete(jobId, dxClient):
    jobResp = dxClient.get_job(JobId=jobId)
    state = jobResp['State']
    print(f'Job status {state}')
    return state == 'COMPLETED'


def unzip_file(fileLocation):
    # s3Client = boto3.client('s3')
    #fileLocation = f's3://{bucket}/{key}'
    print(f'Unzipping {fileLocation}')
    with open(fileLocation, 'rb') as zippedFile:
        try:
            decompressedFile = gzip.decompress(zippedFile.read())
            with open(fileLocation, 'wb') as outfile:
                return outfile.write(decompressedFile)
        except gzip.BadGzipFile:
            print(f'Bad gzip file, skipping: {fileLocation}')


def data_source_meta(client):
    resp = client.list_data_sets(Origin='ENTITLED')
    dataSets = resp['DataSets']
    parsedDataSets = [dict(
        id=el['Id'],
        name=el['Name']
    ) for el in dataSets]

    return parsedDataSets


def data_source_revisions(client, dataSetId, nextToken='', lastRevs=[]):
    botoArgs = dict(DataSetId=dataSetId)
    if nextToken:
        botoArgs['NextToken'] = nextToken
    resp = client.list_data_set_revisions(**botoArgs)
    revs = resp['Revisions'] + lastRevs
    if 'NextToken' in resp:
        return data_source_revisions(
            client, dataSetId, nextToken=resp['NextToken'], lastRevs=revs)
    else:
        return revs


if __name__ == '__main__':
    main()
