from fastapi import APIRouter, HTTPException
from app.database.connection import get_db_connection
from app.core.functions import success_response, error_response


router = APIRouter(
    prefix="/api/ecosystem",
    tags=["Ecosystem"]
)


@router.get("/apps")
def get_ecosystem_apps():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        app_id,
                        name,
                        slug,
                        description,
                        status,
                        portal_color,
                        icon,
                        route_url,
                        sort_order,
                        is_locked,
                        created_at
                    FROM ecosystem_apps
                    ORDER BY sort_order ASC, app_id ASC;
                """)

                apps = cursor.fetchall()

        return {
            "success": True,
            "message": "Ecosystem apps loaded successfully",
            "data": apps
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}"
        )