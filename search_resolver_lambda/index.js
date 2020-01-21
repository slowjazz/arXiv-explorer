const es = require("elasticsearch");
const awsES = require("http-aws-es");

exports.handler = (event, context, callback) => {
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

    async function singleQueryES(phrase, period, category) {
        const start = Math.trunc(period.start)
        const end = Math.trunc(period.end);
        const esClient = new es.Client({
            hosts: [ES_DOMAIN_URL],
            connectionClass: awsES
        });

        // ES 2.3 Query and Aggregations
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/query-filter-context.html
        // https://www.elastic.co/guide/en/elasticsearch/reference/2.3/search-aggregations-bucket-datehistogram-aggregation.html

        const queryBody = {
            _source: false,
            size: 0,
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
                                gte: start,
                                lte: end
                            }
                        }
                    }
                }
            },

            aggs: {
                articles_over_time: {
                    date_histogram: {
                        field: "fields.published_date",
                        interval: "month",
                        format: "yyyy-MM-dd"
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
            singleQueryES(phrase, req.period, req.category)));
     }

    function transformAgg(data){
        return data.aggregations.articles_over_time.buckets.map(bucket => ({
            t: parseInt(bucket.key_as_string),
            y: bucket.doc_count
        }))
    }

    async function getESResponse(req){
        const res = await queryES(req);
        console.log(res);
        const resFiltered = res.map((obj, i) => ({
            phrase: req.phrases[i],
            data: obj
        })).map(markedObj => ({
            phrase: markedObj.phrase,
            data: transformAgg(markedObj.data)
        }));
        return resFiltered
    }

    switch (event.httpMethod) {
        case "POST":
            const body = JSON.parse(event.body);
            getESResponse(body).then(res => done(null, res));
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
