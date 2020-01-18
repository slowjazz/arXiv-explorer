const es = require("elasticsearch");
const awsES = require("http-aws-es");

exports.handler = (event, context, callback) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const done = (err, res) =>
        callback(null, {
            statusCode: err ? "400" : "200",
            body: err ? err.message : JSON.stringify(res),
            headers: {
                "Content-Type": "application/json"
            }
        });

    const ES_DOMAIN_URL = process.env.ES_DOMAIN_URL;
    const ES_INDEX = process.env.ES_INDEX;

    if (ES_DOMAIN_URL === undefined) {
        done(new Error(`Invalid Elasticsearch URL "${ES_DOMAIN_URL}`));
    }

    async function singleQueryES(phrase, period, interval, category) {
        console.log("interval: ", period);
        const esClient = new es.Client({
            hosts: [ES_DOMAIN_URL],
            connectionClass: awsES
        });

        // ES 2.3 Query and Aggregations
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/query-filter-context.html
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/search-aggregations-bucket-histogram-aggregation.html

        const queryBody = {
            query: {
                bool: {
                    must: {
                        query_string: {
                            query: phrase
                        }
                    },
                    filter: {
                        range: {
                            "fields.published_date": {
                                gte: period.start,
                                lte: period.end
                            }
                        }
                    }
                }
            },

            aggs: {
                counts: {
                    histogram: {
                        field: "fields.published_date",
                        interval: interval,
                        offset: period.start
                    }
                }
            }
        };
        return esClient.search(
            {
                index: ES_INDEX,
                body: queryBody
            }
        );
    }

    async function queryES(req) {
        return Promise.all(req['phrases'].map(phrase => 
            singleQueryES(phrase, req.period, req.interval, req.category) 
        ));
     }

    switch (event.httpMethod) {
        case "POST":
            const body = JSON.parse(event.body);
            queryES(body).then(res => done(null, res));
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
