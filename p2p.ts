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