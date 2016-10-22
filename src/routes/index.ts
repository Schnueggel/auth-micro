import { TokenService } from '../services/token-service';
import { UserService } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { authRoutesFactory } from './auth-routes';
import { IApp } from '../server';
import { userRoutesFactory } from './user-routes';

export function routesFactory(app: IApp, tokenService: TokenService, userService: UserService, keyStoreService: KeyStoreService): void {
    authRoutesFactory(app, tokenService, userService, keyStoreService);
    userRoutesFactory(app, tokenService, userService, keyStoreService);
}
