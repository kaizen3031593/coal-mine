exports.handler = async function(event) {
    let password = ''
    if(event.queryStringParameters && event.queryStringParameters.word) {
        password = event.queryStringParameters.word;
    }
    let message = `uh-uh-uh! you didn\'t enter the magic word!\n${password} is wrong!`;
    if(password === 'surprise'){
        message = 'surprise!';
    }
    else if(password === ''){
        message = 'guess the magic word!\nquery for word: ?word=...';
    }
    let response = {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: message
    };
    return response;
  };