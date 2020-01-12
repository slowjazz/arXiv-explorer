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
    
    async function queryES(phrase, interval, category, send){
        console.log('interval: ', interval)
        const esClient = new es.Client({
            hosts: [ES_DOMAIN_URL],
            connectionClass: awsES
        });

        // ES 2.3 Query Format
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/query-filter-context.html

        const queryBody = {
            "query": {
                "bool": {
                    "must": {
                        "query_string": {
                            "query": phrase
                        }
                    },
                    "filter": {
                        "range": {
                            "fields.published_date": {
                                "gte": interval.start,
                                "lte": interval.end
                            }
                        }
                    }
                }
            },

        // Query for aggregations, i.e. count # of documents found in specified intervals
        // "aggs": {
        //     "counts": {
        //         "histogram": {
        //             "field": "fields.published_date",
        //             "interval": 10000000.0,
        //             "offset": 1546437606.0
        //         }
        //     }
        // }
        }

        esClient.search({
            index: ES_INDEX,
            body: queryBody

        }, (err, res) => {
            if (err) throw err;
            console.log(res);
            send(null, JSON.stringify(res.hits.total));
        });
    }

    switch (event.httpMethod) {
        case 'POST':
            const body = JSON.parse(event.body);
            queryES(body.phrases[0], body.interval, body.category, done);
            break
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
