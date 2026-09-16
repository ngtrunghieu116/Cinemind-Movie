import enum
from datetime import datetime, date
import pytz
from decimal import Decimal
from typing import Optional, List

_VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

def _get_now_vn():
    return datetime.now(_VN_TZ).replace(tzinfo=None)
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, Boolean, DateTime, Date,
    Numeric, ForeignKey, Enum as SQLEnum, Table
)
from sqlalchemy.orm import relationship
from .database import Base

class MovieStatus(str, enum.Enum):
    NOW_SHOWING = "NOW_SHOWING"
    COMING_SOON = "COMING_SOON"
    STOPPED = "STOPPED"

class AgeRating(str, enum.Enum):
    P = "P"
    K = "K"
    T13 = "T13"
    T16 = "T16"
    T18 = "T18"
    C = "C"

class ShowtimeSeatStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    HELD = "HELD"
    RESERVED = "RESERVED"
    SOLD = "SOLD"

class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

# Many-to-Many Movie <-> Genre
movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column("movie_id", BigInteger, ForeignKey("movies.id"), primary_key=True),
    Column("genre_id", BigInteger, ForeignKey("genres.id"), primary_key=True),
)

class Genre(Base):
    __tablename__ = "genres"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500))

class Movie(Base):
    __tablename__ = "movies"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    title_en = Column(String(200))
    description = Column(Text, nullable=False)
    director = Column(String(200), nullable=False)
    actors = Column(String(500), nullable=False)
    duration = Column(Integer, nullable=False)
    release_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    poster_path = Column(String(255), nullable=False)
    banner_path = Column(String(255))
    trailer_url = Column(String(500))
    age_rating = Column(String(20), nullable=False)
    language = Column(String(100), nullable=False)
    subtitle = Column(String(100))
    status = Column(String(50), nullable=False)

    genres = relationship("Genre", secondary=movie_genres, backref="movies")
    showtimes = relationship("Showtime", back_populates="movie")

class Theater(Base):
    __tablename__ = "theaters"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(20))
    city = Column(String(50))

    rooms = relationship("Room", back_populates="theater")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    room_type = Column(String(20), nullable=False)
    theater_id = Column(BigInteger, ForeignKey("theaters.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    source_room_id = Column(String(50))

    theater = relationship("Theater", back_populates="rooms")
    seats = relationship("Seat", back_populates="room")
    showtimes = relationship("Showtime", back_populates="room")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(BigInteger, ForeignKey("rooms.id"), nullable=False)
    row_name = Column(String(5), nullable=False)
    seat_number = Column(Integer, nullable=False)
    seat_type = Column(String(20), nullable=False)

    room = relationship("Room", back_populates="seats")

class Showtime(Base):
    __tablename__ = "showtimes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    movie_id = Column(BigInteger, ForeignKey("movies.id"), nullable=False)
    room_id = Column(BigInteger, ForeignKey("rooms.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    price_standard = Column(Numeric(10, 2), nullable=False)
    price_vip = Column(Numeric(10, 2), nullable=False)
    price_couple = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    is_online_selling = Column(Boolean, default=True)

    movie = relationship("Movie", back_populates="showtimes")
    room = relationship("Room", back_populates="showtimes")
    showtime_seats = relationship("ShowtimeSeat", back_populates="showtime")

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(15), unique=True)
    role = Column(String(20), nullable=False)

    reservations = relationship("Reservation", back_populates="user")

class ShowtimeSeat(Base):
    __tablename__ = "showtime_seats"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    showtime_id = Column(BigInteger, ForeignKey("showtimes.id"), nullable=False)
    seat_id = Column(BigInteger, ForeignKey("seats.id"), nullable=False)
    status = Column(String(20), nullable=False, default="AVAILABLE")
    price = Column(Numeric(10, 2), nullable=False)
    hold_token = Column(String(60))
    held_by_user_id = Column(BigInteger, ForeignKey("users.id"))
    locked_until = Column(DateTime)
    reservation_id = Column(BigInteger, ForeignKey("reservations.id"))

    showtime = relationship("Showtime", back_populates="showtime_seats")
    seat = relationship("Seat")
    held_by_user = relationship("User")
    reservation = relationship("Reservation", back_populates="showtime_seats")

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    booking_code = Column(String(50), unique=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    showtime_id = Column(BigInteger, ForeignKey("showtimes.id"), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime, default=_get_now_vn)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="reservations")
    showtime = relationship("Showtime")
    showtime_seats = relationship("ShowtimeSeat", back_populates="reservation")
    reserved_seats = relationship("ReservedSeat", back_populates="reservation")
    order_items = relationship("OrderItem", back_populates="reservation")

class ReservedSeat(Base):
    __tablename__ = "reserved_seats"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reservation_id = Column(BigInteger, ForeignKey("reservations.id"), nullable=False)
    seat_id = Column(BigInteger, ForeignKey("seats.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    reservation = relationship("Reservation", back_populates="reserved_seats")
    seat = relationship("Seat")

class Product(Base):
    __tablename__ = "products"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    available_quantity = Column(Integer, default=100)
    image_path = Column(String(255))
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    @property
    def type(self):
        return self.category

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reservation_id = Column(BigInteger, ForeignKey("reservations.id"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    reservation = relationship("Reservation", back_populates="order_items")
    product = relationship("Product")

class Article(Base):
    __tablename__ = "articles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    short_description = Column(String(500))
    content = Column(Text, nullable=False)
    poster_url = Column(String(1000))
    status = Column(String(30), default="PUBLISHED")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    movie_id = Column(BigInteger, ForeignKey("movies.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String(1000))
    status = Column(String(30), default="PUBLISHED")
