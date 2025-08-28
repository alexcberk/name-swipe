import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: 'join_session' | 'swipe_action' | 'partner_connected' | 'partner_disconnected' | 'new_match' | 'match_updated';
  sessionId?: string;
  userId?: string;
  data?: any;
}

interface UseWebSocketProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({ onConnect, onDisconnect, onMessage, onError }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('🔗 Attempting to connect to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: WebSocketMessage) => {
    console.log('📤 Sending WebSocket message:', message);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('✅ Message sent successfully');
    } else {
      console.log('❌ WebSocket not connected, readyState:', wsRef.current?.readyState);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}
