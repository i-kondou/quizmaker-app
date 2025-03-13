from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from .models import Base
from os import environ

url = URL.create(
    drivername="mysql+pymysql",
    username=environ["MYSQL_USER"],
    password=environ["MYSQL_PASSWORD"],
    host="db",
    database=environ["MYSQL_DATABASE"],
    query={"charset": "utf8"}
)

engine = create_engine(
    url, 
    echo=True
)


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    reset_database()