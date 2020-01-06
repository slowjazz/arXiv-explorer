const es = require('elasticsearch');
const awsES = require('http-aws-es');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    const ES_DOMAIN_URL = process.env.ES_DOMAIN_URL;
    const ES_INDEX = process.env.ES_INDEX;

    if (ES_DOMAIN_URL === undefined){
        done(new Error(`Invalid Elasticsearch URL "${ES_DOMAIN_URL}`));
    }
    
    const queryES = (phrase, interval, category = null) => {
        const esClient = new es.Client({
            hosts: [ES_DOMAIN_URL],
            connectionClass: awsES
        });

        // ES 2.3 Query Format
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/query-filter-context.html

        const queryBody = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"title": phrase}}
                    ],
                    // "filter" : [
                    //     {"range": {}}
                    // ]
                }
            }
        }

        esClient.search({
            index: ES_INDEX,
            q: phrase,
            body: queryBody

        }, (err, res) => {
            if (err) return err;
            console.log(res);
            return res;
        });
    }

    switch (event.httpMethod) {
        case 'POST':
            const queryRes = queryES("discrete", 0);
            done(queryRes);
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
