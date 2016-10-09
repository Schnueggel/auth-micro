const express = require('express');
const app = express();
const config = require('./config');


app.post('/auth', (req, res) => {

});

app.listen(config.PORT || 9999, function () {});
