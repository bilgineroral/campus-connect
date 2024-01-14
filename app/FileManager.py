from fastapi import UploadFile
import secrets
import math
from PIL import Image
import os

class FileManager:
    def __init__(self, file_path):
        self.file_path: str = file_path

    async def save(self, file: UploadFile, profile_photo: bool = False) -> str:
        filename = file.filename
        # test.png >> ["test", "png"] >> return "png"
        extension = filename.split(".")[1]

        if extension not in ["png", "jpg", "jpeg"]:
            raise ValueError("Invalid file extension")
        
        try:
            token = secrets.token_hex(10)
            img_url = self.file_path + token + ".jpg" # since we always convert to .jpg
            file_content = await file.read()

            with open(img_url, "wb") as file:
                file.write(file_content)

            img = Image.open(img_url)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            if profile_photo:
                img = img.resize((200, 200), Image.LANCZOS)
            else:
                x, y = img.size
                max_length = 800

                if x > y:
                    x2 = max_length
                    y2 = math.floor(y * (x2 / x))
                else:
                    y2 = max_length
                    x2 = math.floor(x * (y2 / y))

                img = img.resize((x2, y2), Image.LANCZOS)

            img.save(img_url, "JPEG", quality=90)

            file.close()
            return img_url
        except Exception as e:
            raise e

    def delete(self, file_url: str) -> None:
        try:
            os.remove(file_url)
            return True
        except Exception as e:
            return False
