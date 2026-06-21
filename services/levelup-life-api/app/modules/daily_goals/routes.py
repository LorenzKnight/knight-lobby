from datetime import date

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