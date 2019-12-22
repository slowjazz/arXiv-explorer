'''
Lambda handler function for making a GET request to Elasticsearch Service to run a search query

Returns JSON of 'hits' data

#### Usage on AWS ####
This Lambda must have an access policy allowing GET requests to ES. 
See: https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/search-example.html

'''

import boto3
import re
import requests
from requests_aws4auth import AWS4Auth

from config import ES_DOMAIN
region = 'us-east-1' 
service = 'es'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

host = ES_DOMAIN # the Amazon ES domain, including https://
index = 'metadata' # placeholder for domain index
url = '/'.join([host, metadata, '_search'])

headers = { "Content-Type": "application/json" }

s3 = boto3.client('s3')

def handler(event, context):

    query = event['query'] # placeholder for getting query keyword
    parameters = {'q':query}

    response = requests.get(url, params=parameters)

    if response.status_code = 200:
        
        return response.text # placeholder for further processing of response

    else:
        raise Exception(
            'Error in HTTP request {}, status code: {}'.format(
                response.url, response.status_code
            )