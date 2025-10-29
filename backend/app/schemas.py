# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional

class BatchCreate(BaseModel):
    batch_id: Optional[str] = None
    device_id: Optional[str] = None
    merkle_root: str  # 0x-prefixed hex 32-byte
    ipfs_cid: Optional[str] = None
    size: Optional[int] = None

class BatchOut(BaseModel):
    id: str
    batch_id: Optional[str]
    device_id: Optional[str]
    merkle_root: str
    ipfs_cid: Optional[str]
    size: Optional[int]
    anchored: int
    tx_hash: Optional[str]
    tx_block: Optional[int]

    class Config:
        orm_mode = True
