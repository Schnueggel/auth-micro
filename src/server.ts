import * as express from 'express';
import config from './config';
import { Request } from '~express/lib/request';
import { Response } from '~express/lib/response';
import UserService from './services/user-service';
import * as StrategyUtils from './utils/strategy-utils';
import KeyStoreService from './services/key-store-service';

const app = express();

const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY);
const userService = new UserService(userStrategy);

const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY);
const keyStoreService = new KeyStoreService(keyStoreStrategy);

app.post('/auth', (req: Request, res: Response) => {

});

app.listen(config.PORT || 9999, function () {});
