import boto3
import gzip
import time
from smart_open import open as open


def main():

    dxClient = boto3.client('dataexchange')

    nasdaq_data_id = '7f9633003e50399a699344131fdf3b73'
    bucket = 'awsdx-data-bucket'
    key = 'securities_data/Equities_XNAS_20200311.csv'

    revisions = data_source_revisions(dxClient, nasdaq_data_id)

    revisions = revisions[:5]
    print(len(revisions))

    jobObjs = [dxS3Jobs(revision, 'awsdx-data-bucket',
                        'securities_data/', dxClient) for revision in revisions]

    awaitJobs(jobObjs, dxClient)

    uncompressFiles(jobObjs)
    print('Done')

    return 'Done'

    #     f = gzip.open('Equities_XNAS_20200311.csv', 'rb')
    #     file_content = f.read()
    # print(file_content)
    # with open('outfile.csv', 'wb+') as outfile:
    #     outfile.write(file_content)
    # f.close()


def uncompressFiles(jobObjs):
    for jobObj in jobObjs:
        unzip_file(jobObj['fileLocation'])


def awaitJobs(jobObjs, dxClient):
    for jobObj in jobObjs:
        while not jobComplete(jobObj['jobId'], dxClient):
            time.sleep(1)

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
        decompressedFile = gzip.decompress(zippedFile.read())
        with open(fileLocation, 'wb') as outfile:
            return outfile.write(decompressedFile)


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
