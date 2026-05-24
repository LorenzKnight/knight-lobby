from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.ecosystem.routes import router as ecosystem_router


app = FastAPI(
    title="Knight Lobby Hub API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3010",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(ecosystem_router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Knight Lobby Hub API is running",
    }