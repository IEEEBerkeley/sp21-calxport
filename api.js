(async function(){
    eval(await fetch("https://apis.google.com/js/api.js").then(res => res.text()))
    console.log(gapi); 
})()

// window.addEventListener("message", e => {
//     console.log(e);
//     return true;
// })

// window.addEventListener('message', e => {
// 	console.log(e);
//     e.source.postMessage('PONG', e.origin);
// });

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
	return data * 2;
});