import * as express from 'express';
import config from './config';

const app = express();

app.post('/auth', (req, res) => {

});

app.listen(config.PORT || 9999, function () {});
