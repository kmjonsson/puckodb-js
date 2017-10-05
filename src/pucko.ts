

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

			// Response (connected is always id=0)
			this.actions[0] = (data) => {
				console.log(data);
				resolve("Connected :-)");
			}

			// Timeout
			setTimeout((e) => {
				reject("Timeout");
			},this.timeout);

			this.webSocket.onerror = (event) => {
				console.log("Connection error :-(");
				this.disconnect();				
				if(this.actions['onError'] !== undefined) {
					this.actions['onError'](event);
				}
			};

			this.webSocket.onclose = (event) => {
				console.log("Connection closed :-(");
				if(this.actions['onClose'] !== undefined) {
					this.actions['onClose'](event);
				}
			};
			
			this.webSocket.onopen = (event) => {
				console.log("Connected :-)");
				if(this.actions['onOpen'] !== undefined) {
					this.actions['onOpen'](event);
				}				
			};
			
			this.webSocket.onmessage = (message) => {
				if(message.data instanceof Blob) { return; }
				console.log("on: ",message.data);
				let data = JSON.parse(message.data)
				console.log(data.id,this.actions[data.id]);
				if(data.id !== undefined && this.actions[data.id]) {
					this.actions[data.id](data);
					delete this.actions[data.id];
					return;
				}
				if(this.actions['onObj'] !== undefined) {
					this.actions['onObj'](data);
				}
			};
		});
	}

	on(action:string, fn: ((any) => void)) {
		this.actions[action] = fn;
		return this;
	}

	onObj(fn: ((any) => void)) {
		return this.on('onObj',fn);
	}

	onError(fn: ((any) => void)) {
		return this.on('onError',fn);
	}

	onClose(fn: ((any) => void)) {
		return this.on('onClose',fn);
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

	create(data) {
		console.log("create: ",data)
		return new Promise((resolve,reject) => {
			let id = this.id++;
			this.actions[id] = (obj) => {
				if(obj['response'] == 'ok') {
					resolve(obj['uuid']);
				} else {
					reject(obj['message']);
				}
			};
			this.webSocket.send(JSON.stringify({ id, type: "create", 'set':data }));
			// Timeout
			setTimeout((args) => {
				delete this.actions[id];
				reject("create Timeout");
				// Disconnect???
			},this.timeout);
		});
	}

	delete(uuid) {
		console.log("delete: ",uuid);
		return new Promise((resolve,reject) => {
			let id = this.id++;
			this.actions[id] = (obj) => {
				if(obj['response'] == 'ok') {
					resolve(obj['uuid']);
				} else {
					reject(obj['message']);
				}
			};
			this.webSocket.send(JSON.stringify({ id, type: "delete", uuid }));
			// Timeout
			setTimeout((args) => {
				delete this.actions[id];
				reject("delete Timeout");
				// Disconnect???
			},this.timeout);
		});
	}

	update(uuid,set={},del:string[]=[]) {
		console.log("update: ",set)
		return new Promise((resolve,reject) => {
			let id = this.id++;
			this.actions[id] = (obj) => {
				if(obj['response'] == 'ok') {
					resolve(obj['uuid']);
				} else {
					reject(obj['message']);
				}
			};
			this.webSocket.send(JSON.stringify({ id, type: "update", uuid, set, 'delete':del}));
			// Timeout
			setTimeout((args) => {
				delete this.actions[id];
				reject("update Timeout");
				// Disconnect???
			},this.timeout);
		});
	}

	deleteKey(uuid,...keys:string[]) {
		return this.update(uuid,{},keys);
	}

	setKey(uuid,key:string,value) {
		return this.update(uuid,{ [key] : value});
	}

}
