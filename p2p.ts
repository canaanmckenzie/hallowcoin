//peer to peer server
//
import * as Websocket from 'ws';
import {Server} from 'ws';

import {add_block_to_chain, Block, get_blockchain, get_latest_block,is_valid_block_structure,replace_chain} from './blockchain';

const sockets: Websocket[] = [];

//don't really need to the numbering
enum message_type {
	QUERY_LATEST = 0,
	QUERY_ALL = 1,
	RESPONSE_BLOCKCHAIN = 2,
}

class Message {
	public type: message_type;
	public data: any;
}

const init_p2p_server = (p2pPort: number) => {
	const server: Server = new Websocket.server({port:p2pPort});
	server.on('connection', (ws: Websocket) => {
		init_connection(ws);
	});
	console.log('Listening websocket p2p port on:' + p2pPort);
};

const get_sockets = () => sockets;

const init_connection = (ws: Websocket) => {
	sockets.push(ws);
	init_message_handler(ws);
	init_error_handler(ws);
	write(ws, query_chain_length_message());
};

const write = (ws: Websocket, message: Message): void => ws.send(JSON.stringify(message));

