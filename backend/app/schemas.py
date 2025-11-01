# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str

class DeviceCreate(BaseModel):
    device_id: str
    name: str

class DeviceHeartbeat(BaseModel):
    device_id: str
    platform: Optional[str] = None
    version: Optional[str] = None
    storage_bytes: Optional[int] = None
