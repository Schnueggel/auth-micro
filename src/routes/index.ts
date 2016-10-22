import { TokenService } from '../services/token-service';
import { UserService } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { authRouteFactory } from './auth-route';
import { IApp } from '../server';

export function routesFactory(app: IApp, tokenService: TokenService, userService: UserService, keyStoreService: KeyStoreService): void {
    authRouteFactory(app, tokenService, userService, keyStoreService);
}
