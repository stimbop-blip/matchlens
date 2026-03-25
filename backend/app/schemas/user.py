from pydantic import BaseModel


class MeOut(BaseModel):
    id: str
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    role: str
