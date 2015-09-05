
const moby = require('./lib');

const app = new moby.Application({
	controllers: './example/controllers',
	initializers: './example/initializer'
});


app.run(3000).then(function () {
	console.log(require('util').inspect(app._router, {depth:10,colors:true}))
}).catch(function (e) {
	console.log(e)
})
