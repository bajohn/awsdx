import boto3
import logging
import time


def handler(event, context):
    client = boto3.client('athena')
    print('starting...')
    response = client.start_query_execution(
        QueryString=__query('2020-07-19'),
        QueryExecutionContext={
            'Database': 'awsdx_db',
            'Catalog': 'AwsDataCatalog'
        },
        WorkGroup='primary',
        ResultConfiguration={
            'OutputLocation': 's3://awsdx-data-bucket/query_results/'
        }

    )

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
    return resp


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
                       ] = curData[i]['VarCharValue']
        ret.append(curRet)
    return ret


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
    limit 2
    """
