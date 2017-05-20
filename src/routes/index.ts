import { TokenService } from '../services/token-service';
import { UserService } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { authRoutesFactory } from './auth-routes';
import { IApp } from '../server';

export function routesFactory(app: IApp, tokenService: TokenService, userService: UserService, keyStoreService: KeyStoreService): void {
    authRoutesFactory(app, tokenService, userService, keyStoreService);
}
