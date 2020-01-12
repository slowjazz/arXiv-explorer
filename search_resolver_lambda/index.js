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
            if (err) throw err;
            console.log(res);
            console.log(res.hits.total);
            send(null, JSON.stringify(res.hits.total));
        });
    }

    switch (event.httpMethod) {
        case 'POST':
            queryES("discrete", 0, 0, done);
            break
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
