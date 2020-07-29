import boto3


def handler(event, context):

    client = boto3.client('dataexchange')
    # nasdaq_data_id = '7f9633003e50399a699344131fdf3b73'
    data_sets = list_data_source_meta(client)
    print(data_sets)
    # revisions = list_data_source_revisions(client, nasdaq_data_id)
    # print(revisions)
    # list_data_set_revisions
    return 'Done'


def list_data_source_meta(client):
    resp = client.list_data_sets(Origin='ENTITLED')
    dataSets = resp['DataSets']
    print(dataSets)
    parsedDataSets = [dict(
        id=el['DataSetId'],
        name=el['Name'],
        # updated=el['UpdatedAt'],
        # arn=el['Arn'],
        # created=el['CreatedAt']
    )for el in dataSets]

    return parsedDataSets

def list_data_source_revisions(client, data_set_id):
    resp = client.list_data_set_revisions(DataSetId='data_set_id')
    return resp