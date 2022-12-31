export type Data = {
    name: string
}


export type WalletRequest = {
    account_id: string,
    private_key: string,
    action: string,
    receiver_id: string,
    method_name: string,
    args: object | string,
    referrer: string,
    callbackUrl?: string,
    attachedNear?: string,
    contract_id: string,
    attached_gas: any,
    app: string,
    public_key: string
}