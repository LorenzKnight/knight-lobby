from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.test.routes import router as test_router


app = FastAPI(
    title="LevelUp Life API",
    version="0.1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:3010",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(test_router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "LevelUp Life API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }