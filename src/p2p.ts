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
	const server: Server = new Websocket.Server({port: p2pPort});
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

const init_message_handler = (ws: Websocket) => {
	ws.on('message',(data:string) => {
		const message: Message = JSON_to_Object<Message>(data);
		if(message === null){
			console.log('could not parse received JSON message ' + data);
			return;
		}
		console.log('Received Message ' + JSON.stringify(message));
		switch(message.type) {
			case message_type.QUERY_LATEST:
                        		console.log("Query latest");
				write(ws,response_latest_msg());
				break;
			case message_type.QUERY_ALL:
                        		console.log("Query all");
				write(ws,response_latest_msg());
				break;
			case message_type.RESPONSE_BLOCKCHAIN:
                        		console.log("Response of blockchain");
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


const init_error_handler = (ws: Websocket) => {

	const close_connection = (my_ws: Websocket) => {
		console.log('connection failed to peer: ' +my_ws.url);
		sockets.splice(sockets.indexOf(my_ws), 1);
	};

	ws.on('close', () => close_connection(ws));
	ws.on('error', () => close_connection(ws));
};

const handle_blockchain_response = (received_blocks: Block[]) => {

	if(received_blocks.length === 0){
		console.log('received blocks chain size is 0');
		return;
	}

	const latest_block_received: Block = received_blocks[received_blocks.length - 1];
	if(!is_valid_block_structure(latest_block_received)){
		console.log('block structure is not valid');
		return;
	}

	const latest_block_held: Block = get_latest_block();


	if(latest_block_received.index > latest_block_held.index){

		console.log('blockchain possibly behind. We got: ' + latest_block_held.index + ' Peer got: ' + latest_block_received.index);
		if(latest_block_held.hash === latest_block_received.previous_hash){
			if(add_block_to_chain(latest_block_received)){
				broadcast(response_latest_msg());
			}
		} else if(received_blocks.length === 1){
			console.log('We have to query the chain from our peer');
			broadcast(query_all_message());
		} else {
			console.log('Received blockchain is longer than current blockchain');
			replace_chain(received_blocks);
		} 

	} else {

		console.log('received blockchain is not longer than recieved blockchain. Doing nothing');
	}
};


const broadcast_latest = (): void => {
	broadcast(response_latest_msg());
};

const connect_to_peers = (new_peer: string): void => {
	const ws: Websocket = new Websocket(new_peer);
	ws.on('open',() => {
		init_connection(ws);
	});
	ws.on('error',() => {
		console.log('connection failed');
	});
};

export{connect_to_peers,broadcast_latest,init_p2p_server,get_sockets};

