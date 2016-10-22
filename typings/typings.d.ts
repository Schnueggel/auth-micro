interface Date {
    now(): number;
}

declare module 'http' {
    import { IncomingMessage } from 'http';

    export interface Response<TBody> extends IncomingMessage {
        body?: TBody;
    }
}

declare module 'redis' {
    export function createClient(port: number, host?: string, options?: ClientOptions): RedisClient;
    export function createClient(unix_socket: string, options?: ClientOptions): RedisClient;
    export function createClient(redis_url: string, options?: ClientOptions): RedisClient;
    export function createClient(options?: ClientOptions): RedisClient;

    export interface ClientOptions {
        host?: string;
        port?: number;
        path?: string;
        url?: string;
        parser?: string;
        string_numbers?: boolean;
        return_buffers?: boolean;
        detect_buffers?: boolean;
        socket_keepalive?: boolean;
        no_ready_check?: boolean;
        enable_offline_queue?: boolean;
        retry_max_delay?: number;
        connect_timeout?: number;
        max_attempts?: number;
        retry_unfulfilled_commands?: boolean;
        auth_pass?: string;
        password?: string;
        db?: string;
        family?: string;
        rename_commands?: { [command: string]: string };
        tls?: any;
        prefix?: string;
        retry_strategy?: Function;
    }

    export class RedisClient {
        expire(key: string, seconds: number): void;

        getAsync(key: string): Promise<string>;

        setAsync(key: string, value: any): Promise<'OK'>;

        delAsync(key: string): Promise<number>;
    }
}

declare module 'node-rsa' {
    namespace NodeRsa {
    }

    class NodeRsa {
        constructor(options: any);

        exportKey(keyType?: string): string;
    }

    export = NodeRsa;
}
