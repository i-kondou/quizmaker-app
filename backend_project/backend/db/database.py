from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from os import environ

url = URL.create(
    drivername="mysql+aiomysql",
    username=environ["MYSQL_USER"],
    password=environ["MYSQL_PASSWORD"],
    host="db",
    database=environ["MYSQL_DATABASE"],
    query={"charset": "utf8"}
)

async_engine = create_async_engine(
    url,
    echo=True
)

async_session = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession
)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            session.close()
