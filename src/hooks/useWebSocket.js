import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

// Module-level singleton
let globalSocket = null;
let globalSubscribers = new Map(); // topic → Set of callbacks

function getWsUrl() {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  // Socket.IO is configured to run on port 8081 per SocketIOConfig.java
  if (envUrl && envUrl.includes('8080')) {
      return envUrl.replace('8080', '8081');
  }
  if (envUrl) {
      return envUrl;
  }
  // Dynamic fallback based on current window location to support multiple clients
  if (typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:8081`;
  }
  return 'http://localhost:8081';
}

function getOrCreateSocket() {
  if (globalSocket) return globalSocket;

  globalSocket = io(getWsUrl(), {
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling']
  });

  globalSocket.on('connect', () => {
    console.log('✅ Socket.IO connected');
    // We don't need to re-subscribe manually with Socket.IO like we did with STOMP,
    // the socket object maintains its listeners across reconnects!
  });

  globalSocket.on('disconnect', () => {
    console.log('🔌 Socket.IO disconnected');
  });

  return globalSocket;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const localListeners = useRef(new Map());

  useEffect(() => {
    let mounted = true;
    const socket = getOrCreateSocket();

    const onConnect = () => { if (mounted) setIsConnected(true); };
    const onDisconnect = () => { if (mounted) setIsConnected(false); };

    if (socket.connected) onConnect();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      mounted = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const subscribe = useCallback((topic, callback) => {
    const socket = getOrCreateSocket();
    
    if (!globalSubscribers.has(topic)) {
      globalSubscribers.set(topic, new Set());
    }
    globalSubscribers.get(topic).add(callback);

    const listener = (data) => {
        callback(data);
    };
    
    socket.on(topic, listener);
    localListeners.current.set(`${topic}-${callback}`, listener);

    return () => {
      globalSubscribers.get(topic)?.delete(callback);
      const listenerToRemove = localListeners.current.get(`${topic}-${callback}`);
      if (listenerToRemove) {
          socket.off(topic, listenerToRemove);
          localListeners.current.delete(`${topic}-${callback}`);
      }
    };
  }, []);

  const publish = useCallback((topic, body) => {
    if (globalSocket && globalSocket.connected) {
      globalSocket.emit(topic, body);
    } else {
      console.warn('Socket.IO not connected, cannot publish to', topic);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      globalSubscribers.clear();
    }
    setIsConnected(false);
  }, []);

  return { subscribe, publish, isConnected, disconnect };
}

export default useWebSocket;
