from typing import Dict
import uuid

""" Example format of active_chats:
         {
            46f60e94-ccd8-46b3-b17d-c94ccb22007a: [
                {
                    "nickname": "dummyuser1",
                    "user_id": 1,
                },
                {
                    "nickname": "dummyuser2",
                    "user_id": 2,
                },
            ],
            46f60e94-ccd8-46b3-b17d-c94ccb22007a: [
                {
                    "nickname": "dummyuser20",
                    "user_id": 20,
                },
                {
                    "nickname": "dummyuser4",
                    "user_id": 4,
                },
            ],
            ...
         } """


class ChatManager:
    _instance = None
    active_chats = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(ChatManager, cls).__new__(cls)
            cls._instance.active_chats = {}
        return cls._instance

    def add_chat_session(self, user1: Dict, user2: Dict):
        chat_id = str(uuid.uuid4())
        self.active_chats[chat_id] = [user1, user2]
        return chat_id

    def remove_chat_session(self, chat_id: str):
        del self.active_chats[chat_id]

    def get_chat_session(self, chat_id: str):
        return self.active_chats.get(chat_id)

    def get_all_chat_sessions(self):
        return self.active_chats
    
