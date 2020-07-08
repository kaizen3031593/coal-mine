const https = require('https');

const apiCanaryBlueprint = async function () {
  const verifyRequest = async function (requestOption) {
    return new Promise((resolve, reject) => {
      let req = https.request(requestOption);
      req.on('response', (res) => {
        if (res.statusCode !== 200) {
            reject("Failed: " + requestOption.path);
        }
        res.on('end', () => {
          resolve();
        })
      });
      req.on('error', (error) => {
        reject(error);
      });
      req.end();
    });
  }

  const options = {'hostname':'ajt66lp5wj.execute-api.us-east-1.amazonaws.com','port':443,'path':'/prod','method':'GET'};
  await verifyRequest(options);
};

exports.handler = async () => {
  return await apiCanaryBlueprint();
};