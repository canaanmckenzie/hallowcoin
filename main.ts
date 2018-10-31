//control the node

//dependencies
import * as bodyParser from 'body-parser';
import * as express from 'express';

import {Block, generate_next_block, get_blockchain} from './blockchain';
import {connect_to_peers, get_sockets, init_p2p_server} from './p2p';

//dev ports
//HTTP for node control
const httpPort : number = parseInt(process.env.HTTP_PORT) || 3001;
//Websocket for peer to peer communication with other ports
const p2pPort  : number = parseInt(process.env.P2P_PORT)  || 6001;


const init_http_server = ( my_http_port: number)=> {
	const app = express();
	app.use(bodyParser.json());


        app.get('/blocks', (req,res) => {
            res.send(get_blockchain());
	    });

	 app.post('/mine_block', (req,res) => {
	    const new_block: Block = generate_next_block(req.body.data);
	    res.send(new_block);
	    });

         app.get('/peers',(req,res) => {
            res.send(get_sockets().map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort));
         });

         app.post('/add_peer', (req,res) => {
            connect_to_peers(req.body.peer);
            res.send();
         });

         app.listen(my_http_port, () =>{
            console.log('Listening on Port: '+ my_http_port);
         });
};


//deploy
init_http_server(httpPort);
init_p2p_server(p2pPort); 

