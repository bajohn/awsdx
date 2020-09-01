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

    queries = {
        'main': __queryRequest(client, date, 'main'),
        'port':  __queryRequest(client, date, 'port')
    }

    queryResults = {}

    for key in queries:
        curResp = queries[key]
        queryExecutionId = curResp['QueryExecutionId']

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

        queryResults[key] = __parseRows(rows)

    mainRet = __clean_main_query(queryResults['main'])
    portMap = __clean_port_query(queryResults['port'])

    for vessel_name in mainRet:
        if vessel_name in portMap:
            mainRet[vessel_name]['foreign_port_of_lading'] = portMap[vessel_name]
        else:
            del mainRet[vessel_name]
            pass

    return __proxyResponse(mainRet)


def __clean_main_query(rows):
    ret = {}
    for row in rows:
        vessel_name = row['vessel_name']
        weight = row['total_weight']
        weight_unit = row['weight_unit']
        converted_weight = __convert_weight(weight, weight_unit)
        if converted_weight:
            if vessel_name in ret:
                ret[vessel_name]['total_weight'] += converted_weight
            else:
                ret[vessel_name] = {
                    'actual_arrival_date': row['actual_arrival_date'],
                    'total_weight': converted_weight,
                    'conveyance_id': row['conveyance_id'],
                    'port_of_unlading': row['port_of_unlading']
                }
    return ret


def __convert_weight(weight, weight_unit):
    weight = float(weight)
    if weight_unit == 'Kilograms':
        return weight / 1000
    elif weight_unit == 'Pounds':
        return weight / 2204.62
    elif weight_unit == 'Metric Ton':
        return weight
    else:
        return 0  # unknown unit


def __clean_port_query(rows):
    return {row['vessel_name']: row['foreign_port_of_lading'] for row in rows}


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


def __queryRequest(client, date, query_name):
    query = __main_query(
        date) if query_name == 'main' else __port_query(date)
    return client.start_query_execution(
        QueryString=query,
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


def __main_query(date):
    return f"""
        SELECT vessel_name,
                actual_arrival_date,
                weight_unit,
                conveyance_id,
                port_of_unlading,
                sum(weight) AS total_weight
        FROM awsdx_db.cbp_headers_tsv
        WHERE actual_arrival_date = DATE('{date}')
                AND conveyance_id is NOT null
        GROUP BY  1,2,3,4,5
        ORDER BY  vessel_name, total_weight DESC
    """


def __port_query(date):
    return f"""
        WITH table1 AS
            (
            SELECT vessel_name,
            foreign_port_of_lading,
            weight,
            row_number() OVER(PARTITION BY vessel_name
            ORDER BY  weight desc) AS row_num
            FROM awsdx_db.cbp_headers_tsv
            WHERE actual_arrival_date = DATE('{date}')
            GROUP BY  1,2,3)
        SELECT vessel_name,
                foreign_port_of_lading
        FROM table1
        WHERE row_num = 1
        order by vessel_name
    """


def __proxyResponse(resp):
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
