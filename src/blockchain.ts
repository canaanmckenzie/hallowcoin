import * as CrpytoJS from 'crypto-js';
import {broadcast_latest} from './p2p';

class Block {

	public index: number;
	public hash: string;
	public previous_hash: string;
	public timestamp: number;
	public data: string;

	constructor(index:number,hash:string,previous_hash:string,timestamp:number,data:string){
		this.index = index;
		this.hash = hash;
		this.previous_hash = previous_hash;
		this.timestamp = timestamp;
		this.data = data;
	}
}


//hash with SHA256 
const calculate_hash = (index:number,previous_hash:string,timestamp:number,data:string): string =>
	CrpytoJS.SHA256(index + previous_hash + timestamp + data).toString();

const genesis_block: Block = new Block(
	0,'D0A1AE119F1CDCE9066B6FD8932F508338856C50B1F377FEA7467EA18E3E6DB5','',1540843437,'Canaan');


let blockchain: Block[] = [genesis_block];

const get_blockchain = (): Block[] => blockchain;

const get_latest_block = (): Block =>blockchain[blockchain.length - 1];



const calculate_hash_for_block = (block: Block): string =>
      calculate_hash(block.index,block.previous_hash,block.timestamp,block.data);


const add_block = (new_block: Block) => {
	if (is_valid_new_block(new_block,get_latest_block())){
		blockchain.push(new_block);
	}
};


const add_block_to_chain = (new_block: Block) => {
	if(is_valid_new_block(new_block,get_latest_block())){
		blockchain.push(new_block);
		return true;
	}
	return false;
};


const generate_next_block = (blockData: string)=>{
	const previous_block: Block = get_latest_block();
	const next_index: number = previous_block.index + 1;
	const next_timestamp: number = new Date().getTime() /1000;
	const next_hash: string = calculate_hash(next_index,previous_block.hash,next_timestamp,blockData);
	const new_block: Block = new Block(next_index,next_hash,previous_block.hash,next_timestamp,blockData);
	return new_block;
}

//validate new block on chain
const is_valid_new_block = (new_block: Block, previous_block: Block) => {
	//not next index
	if(previous_block.index+1 !== new_block.index){
		console.log('invalid index');
		return false;
	//block didn't use previous hash in implementation
	} else if(previous_block.hash !== new_block.previous_hash) {
		console.log('invalid previous_hash');
		return false;
	//incorrectly calculated hash?
	} else if(calculate_hash_for_block(new_block) !== new_block.hash){
		console.log(typeof (new_block.hash) + ' ' + typeof calculate_hash_for_block(new_block));
		console.log('invalid hash: ' + calculate_hash_for_block(new_block)+ ' ' + new_block.hash);
		return false;
	}
	return true;
};

//avoid deformed blocks
const is_valid_block_structure = (block: Block): boolean => {
	return typeof block.index === 'number'
		&& typeof block.hash === 'string'
		&& typeof block.previous_hash === 'string'
		&& typeof block.timestamp === 'number'
		&& typeof block.data === 'string';
};

//validate chain 
const is_valid_chain = (blockchain_to_validate: Block[]): boolean => {
	//check genesis block
	const is_valid_genesis = (block: Block): boolean =>{
		return JSON.stringify(block) === JSON.stringify(genesis_block);
	};

	if (!is_valid_genesis(blockchain_to_validate[0])){
		return false;
	}
	//check validity of each block in the chain via is_valid_new_block
	for (let i = 1; i < blockchain_to_validate.length; i++){
		if(!is_valid_new_block(blockchain_to_validate[i],blockchain_to_validate[i - 1])){
			return false;
		}
	}
	return true;
};




//validate only the longest chain
const replace_chain = (new_blocks: Block[]) => {
	if(is_valid_chain(new_blocks) && new_blocks.length > get_blockchain().length){
		console.log('Valid blockchain received. Replacing current blockchain with new blockchain');
		blockchain = new_blocks;
		broadcast_latest();
	} else {
		console.log('Invalid blockchain received');
	}
};


//outflow
export {Block, get_blockchain, get_latest_block, generate_next_block, is_valid_block_structure, replace_chain, add_block_to_chain};
