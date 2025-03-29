from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
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

async_session = async_sessionmaker(
    async_engine,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
