const es = require("elasticsearch");
const awsES = require("http-aws-es");
const Ajv = require('ajv');

const ES_DOMAIN_URL = process.env.ES_DOMAIN_URL;
const ES_INDEX = process.env.ES_INDEX;
const Schema = require('./schema');

exports.handler = (event, context, callback) => {
  const done = (err, res) =>
    callback(null, {
      statusCode: err ? "400" : "200",
      body: err ? err.message : JSON.stringify(res),
      headers: {
        "Content-Type": "application/json"
      }
    });

  if (ES_DOMAIN_URL === undefined) {
    done(new Error(`Invalid Elasticsearch URL "${ES_DOMAIN_URL}`));
  }

  if (ES_INDEX === undefined) {
    done(new Error(`Invalid Elasticsearch index name "${ES_INDEX}`));
  }

  async function singleQueryES(phrase, period, category) {
    const start = Math.trunc(period.start);
    const end = Math.trunc(period.end);
    const interval = Math.trunc(period.interval)*1000; //Input is milliseconds
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
            match_phrase: {
              "fields.abstract": phrase
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
          histogram: {
            field: "fields.published_date",
            interval: interval
          }
        }
      }
    };
    return esClient.search({
      index: ES_INDEX,
      body: queryBody
    });
  }

  async function queryES(req) {
    return Promise.all(
      req["phrases"].map(phrase =>
        singleQueryES(phrase, req.period, req.category)
      )
    );
  }

  function transformAgg(data) {
    return data.aggregations.articles_over_time.buckets.map(bucket => ({
      t: parseInt(bucket.key_as_string),
      y: bucket.doc_count
    }));
  }

  async function getESResponse(req) {
    validateInput(req);
    const res = await queryES(req);
    console.log(res);
    const resFiltered = res
      .map((obj, i) => ({
        phrase: req.phrases[i],
        data: obj
      }))
      .map(markedObj => ({
        phrase: markedObj.phrase,
        data: transformAgg(markedObj.data)
      }));
    return resFiltered;
  }

  function validateInput(body) {
    const ajv = new Ajv();
    const validate = ajv.compile(Schema);
    const valid = validate(body);
    if (!valid) done(new Error(`Error validating body format: "${ajv.errors}`));
  }

  switch (event.httpMethod) {
    case "POST":
      try {
        const body = JSON.parse(event.body);
        getESResponse(body).then(res => done(null, res));
      } catch (e) {
        done(new Error(`Error parsing request body: "${event.body}`));
      }
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
