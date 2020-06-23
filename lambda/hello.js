exports.handler = async function(event) {
    let name = 'you';
    let food = 'butternut squash';
    if(event.queryStringParameters && event.queryStringParameters.name) {
        name = event.queryStringParameters.name;
    }
    if(event.queryStringParameters && event.queryStringParameters.food) {
        food = event.queryStringParameters.food;
    }
    console.log("request:", JSON.stringify(event, undefined, 2));
    let greeting = `Hello, ${name}! I also like to eat ${food}!`;
    let response = {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: greeting
    };
    console.log("response: " + JSON.stringify(response));
    return response;
  };