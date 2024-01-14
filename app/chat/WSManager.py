from fastapi import WebSocket

from .ChatManager import ChatManager

class WSManager:
    _instance = None
    connections = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(WSManager, cls).__new__(cls)
            cls._instance.connections = {}
        return cls._instance
    
    async def connect(self, uid: int, websocket: WebSocket):
        await websocket.accept()
        self.connections[uid] = websocket
        print(f"New connection established. Connected user id: {uid}")
        return self.connections[uid]

    def disconnect(self, uid: int):
        if uid in self.connections:
            del self.connections[uid]

    def get_connections(self):
        return self.connections.keys()

    async def handle_type_message(self, json_dict):
        sender_id = json_dict["sender"]["user_id"]
        sender_ws = self.connections.get(int(sender_id))

        receiver_id = json_dict["receiver"]["user_id"]
        receiver_ws = self.connections.get(int(receiver_id))

        if sender_ws is not None and receiver_ws is not None:
            json_msg = {
                'sender': json_dict["sender"],
                'receiver': json_dict["receiver"],
                'type': 'message',
                'detail': json_dict["detail"]
            }
            await sender_ws.send_json(json_msg)
            await receiver_ws.send_json(json_msg)

    async def handle_type_request_status(self, json_dict):
        sender_id = json_dict["sender"]["user_id"]
        sender_ws = self.connections.get(int(sender_id))

        receiver_id = json_dict["receiver"]["user_id"]
        receiver_ws = self.connections.get(int(receiver_id))
        if json_dict["detail"] == "accepted":
            # generate a unique key for the chat
            chat_manager = ChatManager()
            if sender_ws is not None and receiver_ws is not None:
                unique_key = chat_manager.add_chat_session(json_dict["sender"], json_dict["receiver"])
                json_msg = {
                    'sender': None,
                    'receiver': None,
                    'type': 'chat_init',
                    'detail': unique_key
                }    
                await sender_ws.send_json(json_msg)
                await receiver_ws.send_json(json_msg)
                
        elif json_dict["detail"] == "rejected":
            json_msg = {
                'type': 'error',
                'detail': f'{json_dict["sender"]["nickname"]} rejected your request.'
            }
            if receiver_ws is not None:
                await receiver_ws.send_json(json_msg)

    async def handle_type_request(self, json_dict):
        receiver = json_dict["receiver"]
        sender = json_dict["sender"]
        receiver_ws: WebSocket = self.connections.get(int(receiver["user_id"]))
        sender_ws: WebSocket = self.connections.get(int(sender["user_id"]))
        if receiver_ws is not None:
            await receiver_ws.send_json(json_dict) # direct the request to the receiver
        else: # receiver is not connected
            fail_msg = {
                'type': 'error',
                'detail': f'{receiver["nickname"]} is not online at the moment.'
            }
            await sender_ws.send_json(fail_msg)

    async def handle_message(self, json_dict):
        message_type = json_dict["type"]
        if message_type == "request_status":
            await self.handle_type_request_status(json_dict)

        elif message_type == "message":
            await self.handle_type_message(json_dict)

        elif message_type == "request":
            await self.handle_type_request(json_dict)
        else:
            pass
            

    async def broadcast(self, message: str):
        for ws in self.connections.values():
            ws.send_text(message)
