from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
import dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

PASSWORD = os.getenv("PASSWORD")
EMAIL = os.getenv("EMAIL")

class EmailManager(FastMail):
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(EmailManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self) -> None:
            conf = ConnectionConfig(
                MAIL_USERNAME=EMAIL,
                MAIL_PASSWORD=PASSWORD,
                MAIL_FROM=EMAIL,
                MAIL_PORT=587,
                MAIL_SERVER="smtp.gmail.com",
                MAIL_STARTTLS=True,
                MAIL_SSL_TLS=False,
                USE_CREDENTIALS=True
            )
            super().__init__(conf)

    async def send_email(self, subject: str, recipient: str, mail_body: str, html_template: str = "", environment: dict = {}):
        message = MessageSchema(
            subject=subject,
            recipients=[recipient],
            body=mail_body,
            subtype="html"
        )
        await self._instance.send_message(message)
