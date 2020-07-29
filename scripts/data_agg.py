import boto3


def main():

    client = boto3.client('dataexchange')
    nasdaq_data_id = '7f9633003e50399a699344131fdf3b73'

    revisions = list_data_source_revisions(client, nasdaq_data_id)
    print(len(revisions))

    return 'Done'


def list_data_source_meta(client):
    resp = client.list_data_sets(Origin='ENTITLED')
    dataSets = resp['DataSets']
    parsedDataSets = [dict(
        id=el['Id'],
        name=el['Name']
    ) for el in dataSets]

    return parsedDataSets


def list_data_source_revisions(client, dataSetId, nextToken='', lastRevs=[]):
    botoArgs = dict(DataSetId=dataSetId)
    if nextToken:
        botoArgs['NextToken'] = nextToken
    resp = client.list_data_set_revisions(**botoArgs)
    revs = resp['Revisions'] + lastRevs
    if 'NextToken' in resp:
        return list_data_source_revisions(
            client, dataSetId, nextToken=resp['NextToken'], lastRevs=revs)
    else:
        return revs


if __name__ == '__main__':
    main()
