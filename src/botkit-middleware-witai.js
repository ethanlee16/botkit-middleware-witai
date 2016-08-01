var wit = require('node-wit');

module.exports = function(config) {

    if (!config || !config.token) {
        throw new Error('No wit.ai API token specified');
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    var middleware = {};

    middleware.receive = function(bot, message, next) {
        if (message.text) {
            wit.captureTextIntent(config.token, message.text, function(err, res) {
              console.log(res);
                if (err) {
                  console.log("WIT ERR", err);
                    next(err);
                } else {
                    message.allOutcomes = res.outcomes.sort(function(a,b) {
                        return b.confidence - a.confidence;
                    });
                    message.outcomes = message.allOutcomes[0];
                    message.q = {}
                    for (var k in message.outcomes.entities) {
                        if (message.outcomes.entities[k].length > 1) {
                            message.q[k] = [];
                            message.outcomes.entities[k].forEach(e => message.q[k].push(e.value));
                        } else {
                            message.q[k] = message.outcomes.entities[k][0].value;
                        }
                    }
                    next();
                }
            });
        }

    };

    middleware.hears = function(tests, message) {
      var entities = message.allOutcomes[0].entities
      if (!entities.intent) return false;
        if (Object.keys(entities).length > 0) {
            for (var i = 0; i < entities.intent.length; i++) {
                for (var t = 0; t < tests.length; t++) {
                    if (entities.intent[i].value == tests[t] &&
                        entities.intent[i].confidence >= config.minimum_confidence) {
                        return true;
                    }
                }
            }
        }

        return false;
    };
    return middleware;

};
