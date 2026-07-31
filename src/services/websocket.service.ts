"use client";

export interface TaskWebsocketEvent {
  action: "CREATE" | "UPDATE" | "UPDATE_STATUS" | "DELETE";
  spaceId: number;
  taskId?: number;
  task?: any;
}

class TaskWebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, (event: TaskWebsocketEvent) => void> = new Map();
  private isConnecting = false;

  connect(spaceId: number, callback: (event: TaskWebsocketEvent) => void): () => void {
    const subKey = `space_${spaceId}_${Math.random()}`;
    this.subscribers.set(subKey, callback);

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.initWebSocket(spaceId);
    }

    return () => {
      this.subscribers.delete(subKey);
    };
  }

  private initWebSocket(spaceId: number) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // Connect through API Gateway or directly to workspace service ws endpoint
      const wsUrl = "ws://localhost:8082/ws-proga/websocket";
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        this.isConnecting = false;
        // Send STOMP CONNECT frame
        socket.send("CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0");

        // Send STOMP SUBSCRIBE frame for this space
        const subFrame = `SUBSCRIBE\nid:sub-0\ndestination:/topic/space/${spaceId}/tasks\n\n\0`;
        socket.send(subFrame);
      };

      socket.onmessage = (event) => {
        const messageStr = event.data;
        if (typeof messageStr === "string" && messageStr.includes("MESSAGE")) {
          try {
            // Extract body after double newline in STOMP frame
            const bodyIdx = messageStr.indexOf("\n\n");
            if (bodyIdx !== -1) {
              const body = messageStr.substring(bodyIdx + 2).replace(/\0$/, "").trim();
              if (body) {
                const parsed: TaskWebsocketEvent = JSON.parse(body);
                this.subscribers.forEach((cb) => cb(parsed));
              }
            }
          } catch (e) {
            console.warn("Error parsing STOMP websocket frame:", e);
          }
        }
      };

      socket.onerror = (err) => {
        this.isConnecting = false;
      };

      socket.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
      };

      this.ws = socket;
    } catch (err) {
      this.isConnecting = false;
      console.warn("WebSocket initialization warning:", err);
    }
  }
}

export const taskWebSocketService = new TaskWebSocketService();
