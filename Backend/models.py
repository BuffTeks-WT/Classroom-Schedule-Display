from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

# --- Shared Models (Base) ---


class HostBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr = Field(..., max_length=150)
    role: str = Field(..., max_length=50)


class EventBase(BaseModel):
    title: str = Field(..., max_length=150)
    description: Optional[str] = None
    requirement: Optional[str] = Field(None, max_length=255)
    numberParticipant: int = Field(..., gt=0)
    location: Optional[str] = Field(None, max_length=255)
    startTime: datetime
    endTime: datetime

# --- Creation Models ---


class ReservationCreate(BaseModel):
    host: HostBase
    event: EventBase
    roomId: int = Field(..., gt=0)
    reservation_status: str = Field(..., max_length=50)

# --- Update Models ---
# All fields optional for update


class HostUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=150)
    role: Optional[str] = Field(None, max_length=50)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    requirement: Optional[str] = Field(None, max_length=255)
    numberParticipant: Optional[int] = Field(None, gt=0)
    location: Optional[str] = Field(None, max_length=255)
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None


class ReservationUpdate(BaseModel):
    host: Optional[HostUpdate] = None
    event: Optional[EventUpdate] = None
    roomId: Optional[int] = Field(None, gt=0)
    reservation_status: Optional[str] = Field(None, max_length=50)

# --- Response Models ---


class ReservationResponse(BaseModel):
    reservation_id: int
    reservation_status: str
    createdAt: datetime
    # endAt might be derived or separate, assuming database returns it

    # Flattened implementation matching the specific return of sp_get_reservations
    # The SP returns "host_name", "event_title" etc directly as columns.
    # While we *could* nest them, keeping the response flat matches the DB result
    # and simplifies the frontend unless we explicitly want to re-structure it.

    # However, to be consistent with our input structure, let's try to nest them
    # in the API response or generic flatten them.
    # Given the previous context, let's stick to the structure returned by the DB for now
    # to minimize "mapping" logic unless requested.

    # Wait, the SP returns flattened columns: host_name, event_title, etc.
    # But for a cleaner API, I should probably group them into objects so the Frontend
    # receives the same shape it sends.

    room_id: int
    room_number: str
    building: str
    capacity: int
    equipment: Optional[str]
    room_status: str

    host_id: int
    host_name: str
    host_email: str
    host_role: str

    event_id: int
    event_title: str
    event_description: Optional[str]
    event_requirement: Optional[str]
    event_guests: int
    event_location: Optional[str]
    startTime: datetime
    endTime: datetime

    class Config:
        orm_mode = True
