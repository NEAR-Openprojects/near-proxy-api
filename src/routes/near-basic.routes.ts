import { FastifyInstance } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import { Db } from 'mongodb';
import * as nearAPI from 'near-api-js';
import * as config from '../utils/config';
import { LoginRequest } from '../utils/types/blockchain.types';
import { WalletRequest } from '../utils/types/request.types';
import { changeFunctionWithoutAttachment, getAccount, getSigningTransactionsWalletUrl, viewFunction } from '../utils/helper/near-helper';
import { functionCall } from 'near-api-js/lib/transaction';
import { TransactionManager } from 'near-transaction-manager';
import { DEFAULT_FUNCTION_CALL_GAS, utils } from 'near-api-js';
import BN from 'bn.js';

const b58 = require('b58');

declare module 'fastify' {
    export interface FastifyInstance {
        mongo: { db: Db };
    }
}

export default async function(fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>) {

    fastify.get('/near/basic/get-keypair', async (request, reply) => {
        let pair = nearAPI.utils.KeyPairEd25519.fromRandom();
        const privateKey = pair.secretKey
        const pub = pair.getPublicKey().data
        const pubKey = Buffer.from(pub).toString('hex')
        const publicKey = "ed25519:" + b58.encode(Buffer.from(pubKey.toUpperCase(), 'hex'))

        return reply.code(200).send({ privateKey: privateKey.toString(), publicKey: publicKey.toString() });
    })

    fastify.post<{ Body: LoginRequest }>('/near/basic/login-url', async (request, reply) => {
        //if (!req.body.referrer || !req.body.public_key || !req.body.contract_id) {
        reply.code(200).send(
            {
                url: config.default().walletUrl + "/login/?referrer=NEAR-API-PROXY " + request.body.app + "&public_key=" + request.body.public_key + "&contract_id=" + request.body.contract_id
            }
        );
    });

    fastify.post<{ Body: WalletRequest }>('/near/basic/view-call', async (rq, reply) => {

        if (Object.keys(rq.body.args).length) {
            rq.body.args = JSON.parse(rq.body.args as string);
        }
        else {
            rq.body.args = {};
        }

        const response = await viewFunction(rq.body.contract_id, rq.body.method_name, rq.body.args);
        reply.code(200).send({ success: true, data: response });
    });


    fastify.post<{ Body: WalletRequest }>('/near/basic/change-call', async (rq, reply) => {
        const response = await changeFunctionWithoutAttachment(rq.body.account_id, rq.body.private_key, rq.body.contract_id, rq.body.method_name, rq.body.args, rq.body.attached_gas);
        reply.code(200).send({ success: true, data: response.data });
    });

    fastify.post<{ Body: WalletRequest }>('/near/basic/get-signing-url', async (rq, reply) => {
        const nearAccount = await getAccount(rq.body.account_id, rq.body.private_key);
        const transactionManager = TransactionManager.fromAccount(nearAccount);

        const transaction = await transactionManager.createTransaction({
            receiverId: rq.body.receiver_id,
            actions: [functionCall(rq.method, rq.body.args as object || {}, DEFAULT_FUNCTION_CALL_GAS, new BN(utils.format.parseNearAmount(rq.body.attachedNear) as string))],
        });

        const walletUrl = getSigningTransactionsWalletUrl([transaction], rq.body.referrer, rq.body.callbackUrl);

        reply.code(200).send(
            {
                success: true,
                url: walletUrl
            }
        );
        
    });
}