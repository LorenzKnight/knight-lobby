from fastapi import APIRouter, HTTPException

from app.database.connection import get_db_connection


router = APIRouter(
    prefix="/api/test",
    tags=["Test"]
)


@router.get("/connection")
def test_database_connection():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, name, created_at
                    FROM test_connection
                    ORDER BY id DESC
                    LIMIT 10;
                """)

                rows = cursor.fetchall()

        return {
            "success": True,
            "message": "Database data loaded successfully",
            "data": rows
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}"
        )