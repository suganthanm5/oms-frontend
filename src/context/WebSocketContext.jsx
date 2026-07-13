import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getCookie } from '../utils/cookieUtils';
import { orderService } from '../services/orderService';
import {
  LocalShippingRounded,
  CheckCircleRounded,
  CancelRounded,
  DoneAllRounded,
  HourglassEmptyRounded,
  WarningRounded,
  Inventory2Rounded,
  ErrorOutlineRounded,
  InfoRounded,
  CloseRounded
} from "@mui/icons-material";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { subscribe, publish, isConnected, disconnect } = useWebSocket();
  const { role, user } = useAuth();

  const [latestOrder, setLatestOrder] = useState(null);
  const [latestStockUpdate, setLatestStockUpdate] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);
  const [orderEvents, setOrderEvents] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const clearUnreadOrders = useCallback(() => {
    setUnreadOrdersCount(0);
    localStorage.setItem(`lastSeenOrders_${user?.id || getCookie('username')}`, new Date().toISOString());
  }, [user]);

  const clearUnreadAlerts = useCallback(() => {
    setUnreadAlertsCount(0);
    localStorage.setItem(`lastSeenAlerts_${user?.id || getCookie('username')}`, new Date().toISOString());
  }, [user]);

  useEffect(() => {
    // Initialize unread counts based on last seen timestamps
    let active = true;
    const initCounts = async () => {
      try {
        if (!user && !getCookie('token')) return;
        
        const lastSeenOrdersStr = localStorage.getItem(`lastSeenOrders_${user?.id || getCookie('username')}`);
        const lastSeenOrdersTime = lastSeenOrdersStr ? new Date(lastSeenOrdersStr).getTime() : 0;
        
        const ordersRes = await orderService.getAll({ size: 10 });
        const ordersList = ordersRes?.content || ordersRes?.data?.content || ordersRes || [];
        
        let newOrders = 0;
        if (Array.isArray(ordersList)) {
          ordersList.forEach(order => {
            const orderTime = new Date(order.updatedAt || order.createdAt || order.orderDate).getTime();
            if (orderTime > lastSeenOrdersTime) {
              newOrders++;
            }
          });
        }
        
        if (active && newOrders > 0) {
          setUnreadOrdersCount(prev => prev + newOrders);
        }
      } catch (err) {
        console.error("Failed to fetch initial unread counts", err);
      }
    };
    initCounts();
    return () => { active = false; };
  }, [user]);

  const addToList = (list, setList, event, max = 20) => {
    setList(prev => [event, ...prev].slice(0, max));
  };

  useEffect(() => {
    // ── Orders topic ─────────────────────────────────────────
    const unsubOrders = subscribe('orders', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';

      // Admin and Manager see all events. Others see only their own outlet's events.
      const isRelevant = !isUserOrOutletManager ||
        (event.outletId && String(event.outletId) === String(userOutletId));

      if (!isRelevant) return;

      setLatestOrder(event);
      addToList(orderEvents, setOrderEvents, event);
      setUnreadOrdersCount(prev => prev + 1);

      if (event.type === 'NEW_ORDER') {
        toast.custom((t) => (
          <div style={{
            opacity: t.visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px',
            display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
            color: '#0f172a', width: '340px', transform: t.visible ? 'translateY(0)' : 'translateY(-20px)'
          }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocalShippingRounded sx={{ fontSize: 28 }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>New Order Placed</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{event.orderNo} from <span style={{fontWeight: 600, color: '#475569'}}>{event.outletName}</span></p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseRounded sx={{ fontSize: 18 }} /></button>
          </div>
        ), { duration: 6000 });
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        const icons = { 
          APPROVED: <CheckCircleRounded sx={{ fontSize: 28 }} />, 
          REJECTED: <CancelRounded sx={{ fontSize: 28 }} />, 
          COMPLETED: <DoneAllRounded sx={{ fontSize: 28 }} />, 
          PENDING: <HourglassEmptyRounded sx={{ fontSize: 28 }} />, 
          PARTIALLY_APPROVED: <WarningRounded sx={{ fontSize: 28 }} /> 
        };
        const colors = { APPROVED: '#10b981', REJECTED: '#ef4444', COMPLETED: '#8b5cf6', PENDING: '#f59e0b', PARTIALLY_APPROVED: '#f59e0b' };
        const bgColor = colors[event.status] || '#3b82f6';
        
        toast.custom((t) => (
          <div style={{
            opacity: t.visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px',
            display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
            color: '#0f172a', width: '340px', transform: t.visible ? 'translateY(0)' : 'translateY(-20px)'
          }}>
            <div style={{ background: `${bgColor}15`, color: bgColor, height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icons[event.status] || <InfoRounded sx={{ fontSize: 28 }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Order Updated</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{event.orderNo} is now <span style={{color: bgColor, fontWeight: 700}}>{event.status}</span></p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseRounded sx={{ fontSize: 18 }} /></button>
          </div>
        ), { duration: 5000 });
      }
    });


    const unsubStock = subscribe('stock-updates', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';

      const isRelevant = !isUserOrOutletManager ||
        (event.outletId && String(event.outletId) === String(userOutletId));

      if (!isRelevant) return;

      setLatestStockUpdate(event);
      toast.custom((t) => (
        <div style={{
          opacity: t.visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px',
          display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
          color: '#0f172a', width: '340px', transform: t.visible ? 'translateY(0)' : 'translateY(-20px)'
        }}>
          <div style={{ background: '#f0f9ff', color: '#0ea5e9', height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2Rounded sx={{ fontSize: 28 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Stock Adjusted</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{event.productName} updated to <span style={{fontWeight: 700, color: '#0ea5e9'}}>{event.newQuantity} units</span></p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseRounded sx={{ fontSize: 18 }} /></button>
        </div>
      ), { duration: 4000 });
    });

    // ── Alerts topic ─────────────────────────────────────────
    const unsubAlerts = subscribe('alerts', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';

      const isRelevant = !isUserOrOutletManager ||
        (event.outletId && String(event.outletId) === String(userOutletId));

      if (!isRelevant) return;

      setLatestAlert(event);
      addToList(alertEvents, setAlertEvents, event);
      setUnreadAlertsCount(prev => prev + 1);

      if (event.type === 'LOW_STOCK_ALERT') {
        toast.custom((t) => (
          <div style={{
            opacity: t.visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '16px', padding: '16px',
            display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 40px -10px rgba(239, 68, 68, 0.2)',
            color: '#0f172a', width: '340px', transform: t.visible ? 'translateY(0)' : 'translateY(-20px)'
          }}>
            <div style={{ background: '#fef2f2', color: '#ef4444', height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ErrorOutlineRounded sx={{ fontSize: 28 }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>Low Stock Alert</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{event.productName} has only <span style={{fontWeight: 700, color: '#ef4444'}}>{event.quantity} units</span> left!</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseRounded sx={{ fontSize: 18 }} /></button>
          </div>
        ), { duration: 8000 });
      }
    });

    // ── Notifications topic ───────────────────────────────────
    const unsubNotifs = subscribe('notifications', (event) => {
      setLatestNotification(event);
      toast.custom((t) => (
        <div style={{
          opacity: t.visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px',
          display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
          color: '#0f172a', width: '340px', transform: t.visible ? 'translateY(0)' : 'translateY(-20px)'
        }}>
          <div style={{ background: '#f5f3ff', color: '#8b5cf6', height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InfoRounded sx={{ fontSize: 28 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>System Notification</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{event.message}</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseRounded sx={{ fontSize: 18 }} /></button>
        </div>
      ), { duration: 5000 });

      // Save to localStorage so they persist in Notification Page
      try {
        const savedNotifs = localStorage.getItem('realtime_notifications');
        const notifsList = savedNotifs ? JSON.parse(savedNotifs) : [];

        // Add new notification to the beginning
        const newNotif = {
          id: `realtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: event.type,
          message: event.message,
          timestamp: event.timestamp || new Date().toISOString()
        };

        // Keep last 50 notifications
        const updatedList = [newNotif, ...notifsList].slice(0, 50);
        localStorage.setItem('realtime_notifications', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Failed to store realtime notification', err);
      }
    });

    return () => {
      unsubOrders();
      unsubStock();
      unsubAlerts();
      unsubNotifs();
    };
  }, [subscribe, role, user]);

  const value = {
    isConnected,
    publish,
    disconnect,
    latestOrder,
    latestStockUpdate,
    latestAlert,
    latestNotification,
    orderEvents,
    alertEvents,
    unreadOrdersCount,
    unreadAlertsCount,
    clearUnreadOrders,
    clearUnreadAlerts,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocketContext must be used inside <WebSocketProvider>');
  return ctx;
}

export default WebSocketContext;
