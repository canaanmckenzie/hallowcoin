//peer to peer server
import * as Websocket from 'ws';
import {Server} from 'ws';

import {add_block_to_chain, Block, get_blockchain, get_latest_block,is_valid_block_structure,replace_chain} from './blockchain';

const sockets: Websocket[] = [];

//don't really need to do the numbering
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

//decode message from websocket connection
const write = (ws: Websocket, message: Message): void => ws.send(JSON.stringify(message));

//handle response from websocket
const JSON_to_Object = <T>(data: string): T => {
	try {
		return JSON.parse(data);
	} catch (e) {
		console.log(e);
		return null;
	}
};

const init_message_handler = (ws: WebSocket) => {
	ws.on('message',(data:string) => {
		const message: Message = JSON_to_Object<Message>(data);
		if(message === null){
			console.log('could not parse received JSON message ' + data);
			return;
		}
		console.log('Received Message ' + JSON.stringify(message));
		switch(message.type) {
			case message_type.QUERY_LATEST:
				write(ws,response_latest_msg());
				break;
			case message_type.QUERY_ALL:
				write(ws,response_latest_msg());
				break;
			case message_type.RESPONSE_BLOCKCHAIN:
				const received_blocks: Block[] = JSON_to_Object<Block[]>(message.data);
				if (received_blocks === null){
					console.log('invalid blocks received: ');
					console.log(message.data);
					break;
				}
				handle_blockchain_response(received_blocks);
				break;
		}
		});
};


//broadcast to peers
const broadcast = (message: Message): void => sockets.forEach((socket) => write(socket,message));


//messages
const query_chain_length_message = (): Message => ({
	'type':message_type.QUERY_LATEST,
	'data':null});
const query_all_message = (): Message => ({
	'type':message_type.QUERY_ALL,
	'data':null});
const response_latest_msg = (): Message => ({
	'type':message_type.RESPONSE_BLOCKCHAIN,
	'data':JSON.stringify([get_latest_block])
});


const init_error_handler = (ws: WebSocket) => {
	const close_connection = (ws: Websocket) => {
		console.log('connection failed to peer: ' +ws.url);
		sockets.splice(sockets.indexOf(myWs), 1);
	};

	
}