from fastapi import WebSocket
import asyncio
import logging

log = logging.getLogger(__name__)

MAX_WS_CONNECTIONS = 200

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        if len(self.active_connections) >= MAX_WS_CONNECTIONS:
            await websocket.close(code=1013, reason="Too many connections")
            log.warning("WebSocket connection rejected: limit reached (%d)", MAX_WS_CONNECTIONS)
            return False
        await websocket.accept()
        self.active_connections.append(websocket)
        return True

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    def broadcast_sync(self, message: dict):
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast_json(message))
        except RuntimeError:
            pass

manager = ConnectionManager()
