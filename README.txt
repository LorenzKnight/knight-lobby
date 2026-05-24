Desde la raíz:
    cd knight-lobby
    docker compose up -d --build


    http://localhost:3010 //Debe abrir el Hub.
    http://localhost:5174 //Debe abrir LevelUp Life.
    http://localhost:8001 //Debe responder Knight Auth API.
    http://localhost:8002 //Debe responder LevelUp Life API.
    http://localhost:8001/docs //Docs de Auth API.
    http://localhost:8002/docs //Docs de LevelUp Life API.

para ejecutar init.sql nuevos despues de tener el projecto corriendo:
en la raiz:
cd /Users/lorenzoknight/Documents/Projects/knight-lobby

cat ./databases/hub/init.sql | docker compose -p knight-lobby exec -T postgres-db psql -U levelup_user -d levelup_life_db

##########################################################################################################################

# Ver estado de todos los servicios
    docker compose -p knight-lobby ps

# Apagar solo el Hub frontend
    docker compose -p knight-lobby stop hub

# Encender solo el Hub frontend
    docker compose -p knight-lobby up -d hub

# Reiniciar solo el Hub frontend
    docker compose -p knight-lobby restart hub

# Ver logs del Hub frontend
    docker compose -p knight-lobby logs hub --tail=80

# Si quieres apagar todo el proyecto Knight Lobby, usa:
    docker compose -p knight-lobby stop

# Y para levantar todo otra vez:
    docker compose -p knight-lobby up -d

# Evita por ahora:
    docker compose -p knight-lobby down -v