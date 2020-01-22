
const schema = {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "The Root Schema",
    "required": [
      "phrases",
      "period",
      "category"
    ],
    "properties": {
      "phrases": {
        "$id": "#/properties/phrases",
        "type": "array",
        "title": "The Phrases Schema",
        "items": {
          "$id": "#/properties/phrases/items",
          "type": "string",
          "default": "",
          "examples": [
            "Neural Networks",
            "Bayesian Networks"
          ],
          "pattern": "^(.*)$"
        }
      },
      "period": {
        "$id": "#/properties/period",
        "type": "object",
        "title": "Period object schema",
        "required": [
          "start",
          "end",
          "interval"
        ],
        "properties": {
          "start": {
            "$id": "#/properties/period/properties/start",
            "type": "number",
            "title": "Start date in Unix Epoch timestamp",
            "default": 0.0,
            "examples": [
              1541593554.524
            ]
          },
          "end": {
            "$id": "#/properties/period/properties/end",
            "type": "number",
            "title": "End date in Unix Epoch timestamp",
            "default": 0,
            "examples": [
              1580000000
            ]
          },
          "interval": {
            "$id": "#/properties/period/properties/interval",
            "type": "number",
            "title": "Bucketing interval in seconds",
            "default": 0,
            "examples": [
              100000000
            ]
          }
        }
      },
      "category": {
        "$id": "#/properties/category",
        "type": "string",
        "default": "",
        "examples": [
          "cs"
        ],
        "pattern": "^(.*)$"
      }
    }
  };

module.exports = schema;