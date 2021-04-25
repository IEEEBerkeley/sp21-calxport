(async function(){
    eval(await fetch("https://apis.google.com/js/api.js").then(res => res.text()))
    console.log(gapi); 
    let mapping = {};

    window.addEventListener('message', async event => {
    	const { origin, source } = event;
        const { type, data } = event.data;
        if (type in mapping) {
      	let callback = mapping[type];
        source.postMessage({
            type: type,
            data: await callback(data)
        }, origin === 'null' ? '*' : origin);
        } else {
      	    console.log('Whoops!');
        }
        return true;
        });
        function listen(messageType, callback) {
        	if (messageType in mapping) throw new Error("You already have that type with a callback");
            mapping[messageType] = callback;
        }
        listen('ping', (data) => {
            gapi.auth2.getAuthInstance().signIn();
    	    return data * 2;
        });
    // end
})()
