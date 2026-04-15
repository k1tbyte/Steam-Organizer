export interface ISteamAuth {
    account_name: string,
    device_id: string,
    identity_secret: string,
    revocation_code: string,
    secret_1: string,
    serial_number: number,
    server_time: number,
    shared_secret: string,
    status: number,
    token_gid: string,
    uri: string,
}