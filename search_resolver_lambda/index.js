const es = require("elasticsearch");
const awsES = require("http-aws-es");

const ES_DOMAIN_URL = process.env.ES_DOMAIN_URL;
const ES_INDEX = process.env.ES_INDEX;

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

  async function singleQueryES(query) {
    const esClient = new es.Client({
      hosts: [ES_DOMAIN_URL],
      connectionClass: awsES
    });

    return esClient.search({
      index: ES_INDEX,
      body: query
    });
  }

  async function getESResponse(req) {
    const results = await Promise.all(req.map(query => singleQueryES(query)));
    return results;
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
