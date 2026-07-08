from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from knight_core.functions import select_from, insert_into, update_table
from app.modules.rewards.service import apply_reward


router = APIRouter(
    prefix="/api/daily-goals",
    tags=["Daily Goals"]
)


# Request body used to complete one daily goal task.
class CompleteDailyGoalTaskRequest(BaseModel):
    user_id: int
    daily_goal_id: int
    daily_goal_task_id: int

class ProgressDailyGoalTaskRequest(BaseModel):
    user_id: int
    daily_goal_id: int
    daily_goal_task_id: int
    progress_amount: float

class CreateDailyGoalRequest(BaseModel):
    user_id: int
    life_area_id: int | None = None

    title: str
    description: str | None = None

    task_title: str
    task_description: str | None = None

    progress_type: str = "checkbox"
    target_value: float = 1
    step_value: float = 1
    unit: str = "task"

    exp_reward: int = 10
    coins_reward: int = 2
    gems_reward: int = 0
    sort_order: int = 0

    reminder_enabled: bool = False
    reminder_interval_minutes: int | None = None
    reminder_start_time: str | None = None
    reminder_end_time: str | None = None

class CheckDailyGoalRemindersRequest(BaseModel):
    user_id: int

class ClosePreviousDayRequest(BaseModel):
    user_id: int


# Calculates the completion percentage.
def calculate_progress(completed_tasks: int, total_tasks: int) -> int:
    if total_tasks <= 0:
        return 0

    return round((completed_tasks / total_tasks) * 100)

# Counter without repetition
def evaluate_daily_goal_completion(
    user_id: int,
    daily_goal_id: int,
    today: date,
):
    tasks_result = select_from(
        table_name="daily_goal_tasks",
        columns=[
            "daily_goal_task_id",
        ],
        where_clause={
            "daily_goal_id": daily_goal_id,
        },
    )

    total_tasks = (
        tasks_result["count"]
        if tasks_result["success"]
        else 0
    )

    completed_tasks_result = select_from(
        table_name="daily_goal_task_logs",
        columns=[
            "daily_goal_task_log_id",
        ],
        where_clause={
            "user_id": user_id,
            "daily_goal_id": daily_goal_id,
            "completed_date": today,
            "is_completed": True,
        },
    )

    completed_tasks = (
        completed_tasks_result["count"]
        if completed_tasks_result["success"]
        else 0
    )

    progress_percent = calculate_progress(
        completed_tasks,
        total_tasks,
    )

    daily_goal_completed = (
        total_tasks > 0
        and completed_tasks == total_tasks
    )

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress_percent": progress_percent,
        "daily_goal_completed": daily_goal_completed,
    }

# Date helper: get the current date according to Sweden
def get_today():
    return datetime.now(ZoneInfo("Europe/Stockholm")).date()

# Datetime helper: get current date and time according to Sweden
def get_now_stockholm():
    return datetime.now(ZoneInfo("Europe/Stockholm"))

# Reminder helper: validar si la hora actual está dentro del rango
def is_current_time_inside_reminder_window(
    current_time,
    start_time,
    end_time,
):
    if not start_time or not end_time:
        return True

    # Caso normal: 08:00 - 22:00
    if start_time <= end_time:
        return start_time <= current_time <= end_time

    # Caso nocturno: 22:00 - 06:00
    return current_time >= start_time or current_time <= end_time


def get_yesterday_stockholm():
    return datetime.now(ZoneInfo("Europe/Stockholm")).date() - timedelta(days=1)


def was_created_on_or_before_date(created_at, target_date):
    if not created_at:
        return True

    if created_at.tzinfo:
        created_date = created_at.astimezone(ZoneInfo("Europe/Stockholm")).date()
    else:
        created_date = created_at.date()

    return created_date <= target_date


def is_task_completed_for_date(user_id: int, task: dict, target_date):
    log_result = select_from(
        table_name="daily_goal_task_logs",
        columns=[
            "daily_goal_task_log_id",
            "progress_value",
            "is_completed",
        ],
        where_clause={
            "user_id": user_id,
            "daily_goal_task_id": task["daily_goal_task_id"],
            "completed_date": target_date,
        },
    )

    task_log = None

    task_logs = get_data_or_empty(log_result)

    if len(task_logs) > 0:
        task_log = task_logs[0]

    progress_type = task["progress_type"] or "checkbox"

    if progress_type == "numeric":
        progress_value = 0

        if task_log and task_log["progress_value"] is not None:
            progress_value = float(task_log["progress_value"])

        target_value = float(task["target_value"] or 1)

        return progress_value >= target_value

    return bool(task_log and task_log["is_completed"])


def get_data_or_empty(result):
    if result["success"]:
        return result["data"] or []

    message = str(result.get("message", ""))

    if "No records found" in message:
        return []

    raise HTTPException(
        status_code=400,
        detail=message or "Database query failed.",
    )



# Loads the daily goals and their task progress.
@router.get("")
def get_daily_goals(user_id: int):
    today = date.today()

    goals_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "life_area_id",
            "title",
            "description",
            "exp_reward",
            "coins_reward",
            "gems_reward",
            "is_active",
            "sort_order",
        ],
        where_clause={
            "user_id": user_id,
            "is_active": True,
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    if not goals_result["success"]:
        return {
            "success": True,
            "message": "No daily goals found",
            "data": [],
            "count": 0,
        }

    daily_goals = []

    for goal in goals_result["data"]:
        tasks_result = select_from(
            table_name="daily_goal_tasks",
            columns=[
                "daily_goal_task_id",
                "daily_goal_id",
                "title",
                "description",
                "is_required",
                "progress_type",
                "target_value",
                "step_value",
                "unit",
                "sort_order",
            ],
            where_clause={
                "daily_goal_id": goal["daily_goal_id"],
            },
            options={
                "order_by": "sort_order",
                "order_direction": "ASC",
            },
        )

        tasks = tasks_result["data"] if tasks_result["success"] else []

        task_logs_result = select_from(
            table_name="daily_goal_task_logs",
            columns=[
                "daily_goal_task_log_id",
                "daily_goal_task_id",
                "progress_value",
                "is_completed",
            ],
            where_clause={
                "user_id": user_id,
                "daily_goal_id": goal["daily_goal_id"],
                "completed_date": today,
            },
        )

        task_logs = task_logs_result["data"] if task_logs_result["success"] else []

        task_logs_by_task_id = {
            log["daily_goal_task_id"]: log
            for log in task_logs
        }

        formatted_tasks = []

        for task in tasks:
            task_log = task_logs_by_task_id.get(
                task["daily_goal_task_id"]
            )

            progress_value = (
                task_log["progress_value"]
                if task_log
                else 0
            )

            is_completed = (
                task_log["is_completed"]
                if task_log
                else False
            )

            target_value = task["target_value"] or 1

            task_progress_percent = calculate_progress(
                float(progress_value),
                float(target_value),
            )

            formatted_tasks.append({
                **task,
                "daily_goal_task_log_id": (
                    task_log["daily_goal_task_log_id"]
                    if task_log
                    else None
                ),
                "progress_value": float(progress_value),
                "target_value": float(target_value),
                "step_value": float(task["step_value"] or 1),
                "is_completed": bool(is_completed),
                "task_progress_text": f"{progress_value}/{target_value} {task['unit']}",
                "task_progress_percent": task_progress_percent,
            })

        total_tasks = len(formatted_tasks)

        completed_tasks = sum(
            1
            for task in formatted_tasks
            if task["is_completed"]
        )

        total_task_progress = sum(
            task["task_progress_percent"]
            for task in formatted_tasks
        )

        progress_percent = (
            round(total_task_progress / total_tasks)
            if total_tasks > 0
            else 0
        )

        daily_goals.append({
            **goal,
            "tasks": formatted_tasks,
            "completed_tasks": completed_tasks,
            "total_tasks": total_tasks,
            "progress_text": f"{completed_tasks}/{total_tasks}",
            "progress_percent": progress_percent,
            "is_completed_today": (
                total_tasks > 0
                and completed_tasks == total_tasks
            ),
        })

    return {
        "success": True,
        "message": "Daily goals loaded successfully",
        "data": daily_goals,
        "count": len(daily_goals),
    }


# Completes one task and rewards the user when all daily goals are completed.
@router.post("/tasks/complete")
def complete_daily_goal_task(payload: CompleteDailyGoalTaskRequest):
    today = date.today()

    # Validate the daily goal.
    goal_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "life_area_id",
            "title",
            "is_active",
        ],
        where_clause={
            "daily_goal_id": payload.daily_goal_id,
            "user_id": payload.user_id,
            "is_active": True,
        },
        options={
            "fetch_first": True,
        },
    )

    if not goal_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Daily goal not found",
        )

    # Validate that the task belongs to the daily goal.
    task_result = select_from(
        table_name="daily_goal_tasks",
        columns=[
            "daily_goal_task_id",
            "daily_goal_id",
            "title",
        ],
        where_clause={
            "daily_goal_task_id": payload.daily_goal_task_id,
            "daily_goal_id": payload.daily_goal_id,
        },
        options={
            "fetch_first": True,
        },
    )

    if not task_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Daily goal task not found",
        )

    # Check whether the task was already completed today.
    existing_task_log = select_from(
        table_name="daily_goal_task_logs",
        columns=[
            "daily_goal_task_log_id",
        ],
        where_clause={
            "user_id": payload.user_id,
            "daily_goal_task_id": payload.daily_goal_task_id,
            "completed_date": today,
        },
        options={
            "fetch_first": True,
        },
    )

    # Register the completed task when no log exists.
    if not existing_task_log["success"]:
        task_log_result = insert_into(
            table_name="daily_goal_task_logs",
            query_data={
                "user_id": payload.user_id,
                "daily_goal_id": payload.daily_goal_id,
                "daily_goal_task_id": payload.daily_goal_task_id,
                "completed_date": today,
                "progress_value": 1,
                "is_completed": True,
            },
        )

        if not task_log_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=task_log_result["message"],
            )

    # Count all tasks belonging to the current daily goal.
    tasks_result = select_from(
        table_name="daily_goal_tasks",
        columns=[
            "daily_goal_task_id",
        ],
        where_clause={
            "daily_goal_id": payload.daily_goal_id,
        },
    )

    total_tasks = (
        tasks_result["count"]
        if tasks_result["success"]
        else 0
    )

    # Count today's completed tasks for the current daily goal.
    completed_tasks_result = select_from(
        table_name="daily_goal_task_logs",
        columns=[
            "daily_goal_task_log_id",
        ],
        where_clause={
            "user_id": payload.user_id,
            "daily_goal_id": payload.daily_goal_id,
            "completed_date": today,
            "is_completed": True,
        },
    )

    completed_tasks = (
        completed_tasks_result["count"]
        if completed_tasks_result["success"]
        else 0
    )

    progress_percent = calculate_progress(
        completed_tasks,
        total_tasks,
    )

    daily_goal_completed = (
        total_tasks > 0
        and completed_tasks == total_tasks
    )

    reward_applied = False
    game_profile = None
    all_daily_goals_completed = False
    completed_daily_goals = 0
    total_daily_goals = 0

    # Continue only when every task in the current goal is completed.
    if daily_goal_completed:
        completion_exists = select_from(
            table_name="daily_goal_completion_logs",
            columns=[
                "daily_goal_completion_log_id",
            ],
            where_clause={
                "user_id": payload.user_id,
                "daily_goal_id": payload.daily_goal_id,
                "completed_date": today,
            },
            options={
                "fetch_first": True,
            },
        )

        # Register the current daily goal as completed.
        if not completion_exists["success"]:
            completion_result = insert_into(
                table_name="daily_goal_completion_logs",
                query_data={
                    "user_id": payload.user_id,
                    "daily_goal_id": payload.daily_goal_id,
                    "completed_date": today,
                },
            )

            if not completion_result["success"]:
                raise HTTPException(
                    status_code=400,
                    detail=completion_result["message"],
                )

        # Load every active daily goal belonging to the user.
        active_goals_result = select_from(
            table_name="daily_goals",
            columns=[
                "daily_goal_id",
                "life_area_id",
                "exp_reward",
                "coins_reward",
                "gems_reward",
            ],
            where_clause={
                "user_id": payload.user_id,
                "is_active": True,
            },
        )

        if not active_goals_result["success"]:
            raise HTTPException(
                status_code=400,
                detail="Could not load active daily goals",
            )

        daily_goals = active_goals_result["data"]
        total_daily_goals = len(daily_goals)

        active_goal_ids = {
            goal["daily_goal_id"]
            for goal in daily_goals
        }

        # Load today's completed daily goals.
        completed_goals_result = select_from(
            table_name="daily_goal_completion_logs",
            columns=[
                "daily_goal_id",
            ],
            where_clause={
                "user_id": payload.user_id,
                "completed_date": today,
            },
        )

        completed_goal_ids = set()

        if completed_goals_result["success"]:
            completed_goal_ids = {
                completion["daily_goal_id"]
                for completion in completed_goals_result["data"]
            }

        # Only count completion logs belonging to active goals.
        completed_active_goal_ids = (
            active_goal_ids & completed_goal_ids
        )

        completed_daily_goals = len(completed_active_goal_ids)

        all_daily_goals_completed = (
            total_daily_goals > 0
            and active_goal_ids.issubset(completed_goal_ids)
        )

        # Apply one general reward after completing every active goal.
        if all_daily_goals_completed:
            reward_exists = select_from(
                table_name="daily_goal_reward_logs",
                columns=[
                    "daily_goal_reward_log_id",
                ],
                where_clause={
                    "user_id": payload.user_id,
                    "rewarded_date": today,
                },
                options={
                    "fetch_first": True,
                },
            )

            # Prevent duplicate daily rewards.
            if not reward_exists["success"]:
                total_exp_reward = sum(
                    goal["exp_reward"]
                    for goal in daily_goals
                )

                total_coins_reward = sum(
                    goal["coins_reward"]
                    for goal in daily_goals
                )

                total_gems_reward = sum(
                    goal["gems_reward"]
                    for goal in daily_goals
                )

                reward_result = apply_reward(
                    user_id=payload.user_id,
                    source_type="daily_goals_day",
                    source_id=None,
                    exp_earned=total_exp_reward,
                    coins_earned=total_coins_reward,
                    gems_earned=total_gems_reward,
                    reason="Completó todos los objetivos diarios",
                )

                if not reward_result["success"]:
                    raise HTTPException(
                        status_code=400,
                        detail=reward_result["message"],
                    )

                daily_reward_log_result = insert_into(
                    table_name="daily_goal_reward_logs",
                    query_data={
                        "user_id": payload.user_id,
                        "rewarded_date": today,
                        "exp_earned": total_exp_reward,
                        "coins_earned": total_coins_reward,
                        "gems_earned": total_gems_reward,
                    },
                )

                if not daily_reward_log_result["success"]:
                    raise HTTPException(
                        status_code=400,
                        detail=daily_reward_log_result["message"],
                    )

                reward_applied = True
                game_profile = reward_result["data"]

    return {
        "success": True,
        "message": "Daily goal task completed successfully",
        "data": {
            "daily_goal_id": payload.daily_goal_id,
            "daily_goal_task_id": payload.daily_goal_task_id,
            "completed_tasks": completed_tasks,
            "total_tasks": total_tasks,
            "progress_text": f"{completed_tasks}/{total_tasks}",
            "progress_percent": progress_percent,
            "daily_goal_completed": daily_goal_completed,
            "completed_daily_goals": completed_daily_goals,
            "total_daily_goals": total_daily_goals,
            "all_daily_goals_completed": all_daily_goals_completed,
            "reward_applied": reward_applied,
            "game_profile": game_profile,
        },
    }

# Create daily goal
@router.post("")
def create_daily_goal(payload: CreateDailyGoalRequest):
    if not payload.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Daily goal title is required",
        )

    if not payload.task_title.strip():
        raise HTTPException(
            status_code=400,
            detail="Task title is required",
        )

    if payload.progress_type not in ["checkbox", "numeric"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid progress type",
        )

    if payload.target_value <= 0:
        raise HTTPException(
            status_code=400,
            detail="Target value must be greater than zero",
        )

    if payload.step_value <= 0:
        raise HTTPException(
            status_code=400,
            detail="Step value must be greater than zero",
        )

    if payload.life_area_id is not None:
        life_area_result = select_from(
            table_name="life_areas",
            columns=[
                "life_area_id",
                "user_id",
            ],
            where_clause={
                "life_area_id": payload.life_area_id,
                "user_id": payload.user_id,
            },
            options={
                "fetch_first": True,
            },
        )

        if not life_area_result["success"]:
            raise HTTPException(
                status_code=404,
                detail="Life area not found",
            )

    goal_result = insert_into(
        table_name="daily_goals",
        query_data={
            "user_id": payload.user_id,
            "life_area_id": payload.life_area_id,
            "title": payload.title.strip(),
            "description": payload.description,
            "exp_reward": payload.exp_reward,
            "coins_reward": payload.coins_reward,
            "gems_reward": payload.gems_reward,
            "sort_order": payload.sort_order,

            "reminder_enabled": payload.reminder_enabled,
            "reminder_interval_minutes": payload.reminder_interval_minutes,
            "reminder_start_time": payload.reminder_start_time,
            "reminder_end_time": payload.reminder_end_time,
            "last_reminder_at": None,
        },
    )

    if not goal_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=goal_result["message"],
        )

    created_goal_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "life_area_id",
            "title",
            "description",
            "exp_reward",
            "coins_reward",
            "gems_reward",
            "is_active",
            "sort_order",
        ],
        where_clause={
            "user_id": payload.user_id,
            "title": payload.title.strip(),
            "is_active": True,
        },
        options={
            "order_by": "daily_goal_id",
            "order_direction": "DESC",
            "fetch_first": True,
        },
    )

    if not created_goal_result["success"]:
        raise HTTPException(
            status_code=400,
            detail="Daily goal was created but could not be loaded",
        )

    created_goal = created_goal_result["data"]

    task_result = insert_into(
        table_name="daily_goal_tasks",
        query_data={
            "daily_goal_id": created_goal["daily_goal_id"],
            "title": payload.task_title.strip(),
            "description": payload.task_description,
            "progress_type": payload.progress_type,
            "target_value": payload.target_value,
            "step_value": payload.step_value,
            "unit": payload.unit,
            "sort_order": 0,
        },
    )

    if not task_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=task_result["message"],
        )

    return {
        "success": True,
        "message": "Daily goal created successfully",
        "data": created_goal,
    }

# Add partial progress
@router.post("/tasks/progress")
def progress_daily_goal_task(payload: ProgressDailyGoalTaskRequest):
    today = date.today()

    if payload.progress_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Progress amount must be greater than zero",
        )

    goal_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "life_area_id",
            "title",
            "is_active",
        ],
        where_clause={
            "daily_goal_id": payload.daily_goal_id,
            "user_id": payload.user_id,
            "is_active": True,
        },
        options={
            "fetch_first": True,
        },
    )

    if not goal_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Daily goal not found",
        )

    task_result = select_from(
        table_name="daily_goal_tasks",
        columns=[
            "daily_goal_task_id",
            "daily_goal_id",
            "title",
            "progress_type",
            "target_value",
            "step_value",
            "unit",
        ],
        where_clause={
            "daily_goal_task_id": payload.daily_goal_task_id,
            "daily_goal_id": payload.daily_goal_id,
        },
        options={
            "fetch_first": True,
        },
    )

    if not task_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Daily goal task not found",
        )

    task = task_result["data"]

    if task["progress_type"] != "numeric":
        raise HTTPException(
            status_code=400,
            detail="This task does not support numeric progress",
        )

    existing_log = select_from(
        table_name="daily_goal_task_logs",
        columns=[
            "daily_goal_task_log_id",
            "progress_value",
            "is_completed",
        ],
        where_clause={
            "user_id": payload.user_id,
            "daily_goal_task_id": payload.daily_goal_task_id,
            "completed_date": today,
        },
        options={
            "fetch_first": True,
        },
    )

    current_progress = 0

    if existing_log["success"]:
        current_progress = existing_log["data"]["progress_value"] or 0

    new_progress = float(current_progress) + payload.progress_amount
    target_value = float(task["target_value"] or 1)

    if new_progress > target_value:
        new_progress = target_value

    is_completed = new_progress >= target_value

    if existing_log["success"]:
        save_result = update_table(
            table_name="daily_goal_task_logs",
            query_data={
                "progress_value": new_progress,
                "is_completed": is_completed,
            },
            where_clause={
                "daily_goal_task_log_id": existing_log["data"]["daily_goal_task_log_id"],
            },
        )
    else:
        save_result = insert_into(
            table_name="daily_goal_task_logs",
            query_data={
                "user_id": payload.user_id,
                "daily_goal_id": payload.daily_goal_id,
                "daily_goal_task_id": payload.daily_goal_task_id,
                "completed_date": today,
                "progress_value": new_progress,
                "is_completed": is_completed,
            },
        )

    if not save_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=save_result["message"],
        )

    task_progress_percent = calculate_progress(
        new_progress,
        target_value,
    )

    completion_state = evaluate_daily_goal_completion(
        user_id=payload.user_id,
        daily_goal_id=payload.daily_goal_id,
        today=today,
    )

    return {
        "success": True,
        "message": "Daily goal task progress updated successfully",
        "data": {
            "daily_goal_id": payload.daily_goal_id,
            "daily_goal_task_id": payload.daily_goal_task_id,
            "progress_value": new_progress,
            "target_value": target_value,
            "unit": task["unit"],
            "task_progress_text": f"{new_progress}/{target_value} {task['unit']}",
            "task_progress_percent": task_progress_percent,
            "task_completed": is_completed,
            "completed_tasks": completion_state["completed_tasks"],
            "total_tasks": completion_state["total_tasks"],
            "progress_text": f"{completion_state['completed_tasks']}/{completion_state['total_tasks']}",
            "progress_percent": completion_state["progress_percent"],
            "daily_goal_completed": completion_state["daily_goal_completed"],
        },
    }

# ============================================================
# Reminder helper: obtiene la primera tarea pendiente del hábito
# ============================================================
# Este helper busca las tareas de un daily goal y revisa los logs
# del día actual. Devuelve la primera tarea que todavía no está
# completada, incluyendo su progreso actual si es numérica.
def get_first_pending_task_for_daily_goal(
    user_id: int,
    daily_goal_id: int,
    today,
):
    tasks_result = select_from(
        table_name="daily_goal_tasks",
        columns=[
            "daily_goal_task_id",
            "daily_goal_id",
            "title",
            "description",
            "progress_type",
            "target_value",
            "step_value",
            "unit",
            "sort_order",
        ],
        where_clause={
            "daily_goal_id": daily_goal_id,
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    if not tasks_result["success"]:
        return None

    for task in tasks_result["data"]:
        log_result = select_from(
            table_name="daily_goal_task_logs",
            columns=[
                "daily_goal_task_log_id",
                "progress_value",
                "is_completed",
            ],
            where_clause={
                "user_id": user_id,
                "daily_goal_task_id": task["daily_goal_task_id"],
                "completed_date": today,
            },
        )

        task_log = None

        task_logs = get_data_or_empty(log_result)

        if len(task_logs) > 0:
            task_log = task_logs[0]

        progress_value = 0

        if task_log and task_log["progress_value"] is not None:
            progress_value = float(task_log["progress_value"])

        target_value = float(task["target_value"] or 1)
        unit = task["unit"] or "task"
        progress_type = task["progress_type"] or "checkbox"

        if progress_type == "numeric":
            is_completed = progress_value >= target_value

            if not is_completed:
                return {
                    **task,
                    "progress_value": progress_value,
                    "target_value": target_value,
                    "unit": unit,
                    "task_progress_text": f"{progress_value:g}/{target_value:g} {unit}",
                }

        else:
            is_completed = bool(task_log and task_log["is_completed"])

            if not is_completed:
                return {
                    **task,
                    "progress_value": progress_value,
                    "target_value": target_value,
                    "unit": unit,
                    "task_progress_text": "",
                }

    return None

# Den upptäcker pågående vanor och meddelar dig.
@router.post("/reminders/check")
def check_daily_goal_reminders(payload: CheckDailyGoalRemindersRequest):
    now_stockholm = get_now_stockholm()
    now_utc = datetime.now(timezone.utc)
    today = now_stockholm.date()
    current_time = now_stockholm.time()

    goals_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "title",
            "description",
            "reminder_enabled",
            "reminder_interval_minutes",
            "reminder_start_time",
            "reminder_end_time",
            "last_reminder_at",
        ],
        where_clause={
            "user_id": payload.user_id,
            "is_active": True,
            "reminder_enabled": True,
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    if not goals_result["success"]:
        return {
            "success": True,
            "message": "No reminder-enabled daily goals found",
            "data": [],
            "count": 0,
        }

    notifications = []

    for goal in goals_result["data"]:
        reminder_interval_minutes = goal["reminder_interval_minutes"]

        if not reminder_interval_minutes or reminder_interval_minutes <= 0:
            continue

        is_inside_window = is_current_time_inside_reminder_window(
            current_time=current_time,
            start_time=goal["reminder_start_time"],
            end_time=goal["reminder_end_time"],
        )

        if not is_inside_window:
            continue

        pending_task = get_first_pending_task_for_daily_goal(
            user_id=payload.user_id,
            daily_goal_id=goal["daily_goal_id"],
            today=today,
        )

        if not pending_task:
            continue

        last_reminder_at = goal["last_reminder_at"]

        if last_reminder_at:
            if last_reminder_at.tzinfo is None:
                last_reminder_at = last_reminder_at.replace(
                    tzinfo=timezone.utc
                )

            minutes_since_last_reminder = (
                now_utc - last_reminder_at.astimezone(timezone.utc)
            ).total_seconds() / 60

            if minutes_since_last_reminder < reminder_interval_minutes:
                continue

        task_title = pending_task["title"]
        task_description = pending_task["description"]
        goal_description = goal["description"]
        task_progress_type = pending_task["progress_type"]

        base_message = task_description or goal_description or task_title

        if task_progress_type == "numeric":
            reminder_message = (
                f"{base_message} "
                f"Progreso actual: {pending_task['task_progress_text']}."
            ).strip()
        else:
            reminder_message = base_message

        notification = {
            "daily_goal_id": goal["daily_goal_id"],
            "daily_goal_task_id": pending_task["daily_goal_task_id"],
            "title": "Tu avatar te necesita",
            "message": reminder_message,
            "type": "reminder",
            "icon": "🥺",
            "daily_goal_title": goal["title"],
            "task_title": task_title,
        }
            
        notifications.append(notification)

        update_result = update_table(
            table_name="daily_goals",
            query_data={
                "last_reminder_at": now_utc,
            },
            where_clause={
                "daily_goal_id": goal["daily_goal_id"],
            },
        )

        if not update_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=update_result["message"],
            )

    return {
        "success": True,
        "message": "Daily goal reminders checked successfully",
        "data": notifications,
        "count": len(notifications),
    }

# Close the previous day and apply penalties for missed tasks and goals.
@router.post("/day/close")
def close_previous_daily_goals_day(payload: ClosePreviousDayRequest):
    penalty_date = get_yesterday_stockholm()

    existing_penalty_result = select_from(
        table_name="daily_life_penalties",
        columns=[
            "daily_life_penalty_id",
            "user_id",
            "penalty_date",
            "missed_tasks",
            "missed_goals",
            "life_lost",
            "level_lost",
            "created_at",
        ],
        where_clause={
            "user_id": payload.user_id,
            "penalty_date": penalty_date,
        },
    )

    existing_penalties = get_data_or_empty(existing_penalty_result)

    if len(existing_penalties) > 0:
        return {
            "success": True,
            "message": "Previous day was already closed.",
            "data": {
                "penalty_date": penalty_date,
                "penalty_applied": False,
                "already_closed": True,
                "penalty": existing_penalties[0],
            },
        }

    goals_result = select_from(
        table_name="daily_goals",
        columns=[
            "daily_goal_id",
            "user_id",
            "title",
            "is_active",
            "created_at",
        ],
        where_clause={
            "user_id": payload.user_id,
            "is_active": True,
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    goals = get_data_or_empty(goals_result)

    missed_tasks = 0
    missed_goals = 0
    checked_goals = 0
    checked_tasks = 0

    for goal in goals:
        goal_existed_on_penalty_date = was_created_on_or_before_date(
            goal["created_at"],
            penalty_date,
        )

        if not goal_existed_on_penalty_date:
            continue

        tasks_result = select_from(
            table_name="daily_goal_tasks",
            columns=[
                "daily_goal_task_id",
                "daily_goal_id",
                "title",
                "progress_type",
                "target_value",
                "created_at",
            ],
            where_clause={
                "daily_goal_id": goal["daily_goal_id"],
            },
            options={
                "order_by": "sort_order",
                "order_direction": "ASC",
            },
        )

        tasks = get_data_or_empty(tasks_result)

        goal_has_missed_tasks = False
        goal_had_tasks_that_day = False

        for task in tasks:
            task_existed_on_penalty_date = was_created_on_or_before_date(
                task["created_at"],
                penalty_date,
            )

            if not task_existed_on_penalty_date:
                continue

            goal_had_tasks_that_day = True
            checked_tasks += 1

            task_completed = is_task_completed_for_date(
                user_id=payload.user_id,
                task=task,
                target_date=penalty_date,
            )

            if not task_completed:
                missed_tasks += 1
                goal_has_missed_tasks = True

        if goal_had_tasks_that_day:
            checked_goals += 1

        if goal_has_missed_tasks:
            missed_goals += 1

    if checked_tasks == 0:
        return {
            "success": True,
            "message": "There were no daily tasks to close for previous day.",
            "data": {
                "penalty_date": penalty_date,
                "penalty_applied": False,
                "already_closed": False,
                "checked_goals": checked_goals,
                "checked_tasks": checked_tasks,
                "missed_tasks": missed_tasks,
                "missed_goals": missed_goals,
            },
        }

    if missed_tasks == 0:
        insert_result = insert_into(
            table_name="daily_life_penalties",
            query_data={
                "user_id": payload.user_id,
                "penalty_date": penalty_date,
                "missed_tasks": 0,
                "missed_goals": 0,
                "life_lost": 0,
                "level_lost": 0,
            },
        )

        if not insert_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=insert_result["message"],
            )

        return {
            "success": True,
            "message": "Previous day completed successfully. No penalty applied.",
            "data": {
                "penalty_date": penalty_date,
                "penalty_applied": False,
                "already_closed": False,
                "checked_goals": checked_goals,
                "checked_tasks": checked_tasks,
                "missed_tasks": 0,
                "missed_goals": 0,
            },
        }

    profile_result = select_from(
        table_name="user_game_profiles",
        columns=[
            "user_id",
            "level",
            "current_life",
            "max_life",
            "current_exp",
            "total_exp",
            "coins",
            "gems",
        ],
        where_clause={
            "user_id": payload.user_id,
        },
    )

    profiles = get_data_or_empty(profile_result)

    if len(profiles) == 0:
        raise HTTPException(
            status_code=404,
            detail="Game profile not found.",
        )

    profile = profiles[0]

    current_level = int(profile["level"] or 1)
    current_life = int(profile["current_life"] or 0)
    max_life = int(profile["max_life"] or 5)

    level_lost = 0
    life_lost = 1

    if current_life > 1:
        new_life = current_life - 1
        new_level = current_level
    else:
        new_life = max_life
        new_level = max(1, current_level - 1)

        if current_level > 1:
            level_lost = 1

    update_profile_result = update_table(
        table_name="user_game_profiles",
        query_data={
            "level": new_level,
            "current_life": new_life,
            "updated_at": datetime.now(timezone.utc),
        },
        where_clause={
            "user_id": payload.user_id,
        },
    )

    if not update_profile_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=update_profile_result["message"],
        )

    insert_penalty_result = insert_into(
        table_name="daily_life_penalties",
        query_data={
            "user_id": payload.user_id,
            "penalty_date": penalty_date,
            "missed_tasks": missed_tasks,
            "missed_goals": missed_goals,
            "life_lost": life_lost,
            "level_lost": level_lost,
        },
    )

    if not insert_penalty_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=insert_penalty_result["message"],
        )

    if level_lost:
        message = "No completaste tus tareas diarias. Perdiste un nivel y recuperaste tus corazones."
    else:
        message = "No completaste tus tareas diarias. Perdiste un corazón."

    return {
        "success": True,
        "message": "Previous day closed with penalty.",
        "data": {
            "penalty_date": penalty_date,
            "penalty_applied": True,
            "already_closed": False,
            "checked_goals": checked_goals,
            "checked_tasks": checked_tasks,
            "missed_tasks": missed_tasks,
            "missed_goals": missed_goals,
            "life_lost": life_lost,
            "level_lost": level_lost,
            "message": message,
            "game_profile": {
                "user_id": payload.user_id,
                "level": new_level,
                "current_life": new_life,
                "max_life": max_life,
                "current_exp": profile["current_exp"],
                "total_exp": profile["total_exp"],
                "coins": profile["coins"],
                "gems": profile["gems"],
            },
        },
    }