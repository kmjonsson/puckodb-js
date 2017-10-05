
import $ = require("jquery");

/*

var puckodb = {
    "connect": function(ws) {
        //webSocket = new WebSocket('ws://127.0.0.1:9999/');
        this.webSocket = new WebSocket('ws://192.168.2.2:9999/');

        this.webSocket.onerror = function(event) {
        }.bind(this);

        this.webSocket.onclose = function(event) {        
            setTimeout(function() {
                logit("Reconnecting");
                connect();
            },5000);
        }.bind(this);

        this.webSocket.onopen = function(event) {
        }.bind(this);

        this.webSocket.onmessage = function(message) {
            if(message.data instanceof Blob) { return; }
        }.bind(this);
    }
};

*/

export class Pucko {
	private webSocket:WebSocket;
	private ws:string;
	private reconnect:number;
	private actions:((any) => void)[] = [];
	private id:number = 1;
	private timeout:number;
	constructor(ws: string, reconnect:number=0, timeout:number=5000) {
		this.ws = ws;
		this.reconnect = reconnect;
		this.timeout = timeout;
	}
	disconnect() {
		// TODO: ...
	}
	connect() {
		return new Promise((resolve,reject) => {
			this.id = 1;

			this.webSocket = new WebSocket(this.ws);
			if(!this.webSocket) {
				reject("Failed?");
				return;
			}
			// Response
			this.actions[0] = (data) => {
				console.log(data);
				resolve("Connected :-) action");
			}
			// Timeout
			setTimeout((e) => {
				reject("Timeout");
			},5000);

			this.webSocket.onerror = (event) => {
				this.disconnect();
				console.log("Connection error :-(");
			};

			this.webSocket.onclose = (event) => {
				if(this.reconnect > 0) {
					setTimeout(function() {
						this.connect();
					},this.reconnect);
				}
				console.log("Connection closed :-(");
			};
			
			this.webSocket.onopen = (event) => {
				console.log("Connected :-)");
				// Do nothing?
			};
			
			this.webSocket.onmessage = (message) => {
				if(message.data instanceof Blob) { return; }
				console.log(message.data);
				let data = JSON.parse(message.data)
				console.log(data.id,this.actions[data.id]);
				if(data.id !== undefined && this.actions[data.id]) {
					this.actions[data.id](data);
					delete this.actions[data.id];
				}
			};
		});
	}

	onObj(fn: ((any) => void)) {
		this.actions['onObj'] = fn;
	}

	auth(user:string, password:string) {
		console.log("Auth",user,password);
		return new Promise((resolve,reject) => {
			let id = this.id++;
			this.actions[id] = (obj) => {
				if(obj['response'] == 'ok') {
					resolve(obj['message']);
				} else {
					reject(obj['message']);
				}
			};
			this.webSocket.send(JSON.stringify({ id, type: "auth", user, password }));
			// Timeout
			setTimeout((args) => {
				delete this.actions[id];
				reject("Auth Timeout");
				// Disconnect???
			},this.timeout);
		});
	}

	replay(from:number) {
		console.log("Replay: ",from)
		return new Promise((resolve,reject) => {
			let id = this.id++;
			this.actions[id] = (obj) => {
				if(obj['response'] == 'ok') {
					resolve(obj['message']);
				} else {
					reject(obj['message']);
				}
			};
			this.webSocket.send(JSON.stringify({ id, type: "replay", from }));
			// Timeout
			setTimeout((args) => {
				delete this.actions[id];
				reject("replay Timeout");
				// Disconnect???
			},this.timeout);
		});
	}

}
