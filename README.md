# Knight Lobby Ecosystem

Knight Lobby is a personal software ecosystem built to explore modern product architecture using Python, FastAPI, React, PostgreSQL and Docker.

The project is structured as a monorepo containing multiple frontend applications, backend services, shared packages and database modules.

## Purpose

This project is part of my ongoing technical development beyond my main PHP/SaaS background.
The goal is to build a modern, modular ecosystem where different applications can share authentication, core logic and infrastructure patterns.

The first main application in the ecosystem is **LevelUp Life**, a gamified productivity/life-management app.

## Tech Stack

### Backend

* Python
* FastAPI
* PostgreSQL
* REST APIs
* Shared core packages

### Frontend

* React
* Vite
* JavaScript
* CSS

### Infrastructure

* Docker
* Docker Compose
* PostgreSQL
* Monorepo structure

## Project Structure

```txt
apps/
  hub/
  levelup-life/

services/
  auth-api/
  hub-api/
  levelup-life-api/

packages/
  knight-core/

databases/
  auth/
  hub/
  levelup_life/
```

## Applications

### Knight Lobby Hub

The central hub of the ecosystem.
It is designed to act as an entry point where different applications in the ecosystem can be listed, discovered and accessed.

### LevelUp Life

A gamified productivity application focused on:

* Life areas
* Priorities
* Habits
* Projects
* Personal goals
* Progress tracking
* Game-inspired personal development

## Architecture Goals

The project is designed to explore:

* Modular backend services
* Shared authentication patterns
* Reusable core packages
* API-driven frontend architecture
* PostgreSQL database design
* Docker-based development environments
* Scalable product-oriented architecture

## Why I Built This

As a senior backend/fullstack developer with strong experience in PHP, PostgreSQL and SaaS platforms, I am using this project to deepen my experience with Python, FastAPI and React in a real product-like environment.

Instead of learning these technologies only through isolated tutorials, I am applying them in a structured ecosystem with multiple services, shared modules and frontend applications.

## Status

This project is under active development and is used as a learning-focused product architecture project.

## Author

Lorenzo Knight
GitHub: https://github.com/LorenzKnight
