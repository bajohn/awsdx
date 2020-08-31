import boto3
import logging
import time
import json
import logging


def handler(event, context):
    logger = logging.getLogger('ShipFlow')
    logger.setLevel(logging.INFO)
    # Expected path format: /2020-07-19
    date = event['path'].replace('/', '')

    client = boto3.client('athena')
    logger.info('starting...')
    response = __queryRequest(client, date)

    print('Query sent')
    print(response)

    queryExecutionId = response['QueryExecutionId']

    state = 'INIT'

    while state not in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
        response = client.get_query_execution(
            QueryExecutionId=queryExecutionId
        )
        state = response['QueryExecution']['Status']['State']
        print(state)
        time.sleep(1)

    response = client.get_query_results(
        QueryExecutionId=queryExecutionId,
    )

    rows = response['ResultSet']['Rows']

    resp = __parseRows(rows)
    print(resp)
    return __formatResponse(resp)


def __parseRows(rows):
    # first row is a header row
    headerData = rows.pop(0)['Data']
    ret = []
    for row in rows:
        curData = row['Data']
        curRet = dict()
        for i in range(len(headerData)):
            if 'VarCharValue' in curData[i]:
                curRet[headerData[i]['VarCharValue']
                       ] = curData[i]['VarCharValue'].replace('"', '')
        ret.append(curRet)
    return ret


def __queryRequest(client, date):
    return client.start_query_execution(
        QueryString=__query(date),
        QueryExecutionContext={
            'Database': 'awsdx_db',
            'Catalog': 'AwsDataCatalog'
        },
        WorkGroup='primary',
        ResultConfiguration={
            'OutputLocation': 's3://awsdx-data-bucket/query_results/'
        }
    )

# date format 2020-07-19


def __query(date):
    return f"""
    SELECT vessel_name,
        port_of_unlading,
        foreign_port_of_lading,
        actual_arrival_date,
        weight_unit,
        conveyance_id,
        sum(weight) as total_weight
    FROM awsdx_db.cbp_headers_tsv
    where actual_arrival_date = DATE('{date}')
    group by 1,2,3,4,5,6
    """


def __formatResponse(resp):
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(resp)
    }
