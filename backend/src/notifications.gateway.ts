import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const username = String(client.handshake.auth?.username || client.handshake.query?.username || '');
    if (username) {
      client.join(`user:${username}`);
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('notifications:join')
  joinRoom(@MessageBody() body: { username?: string }, @ConnectedSocket() client: Socket) {
    const username = String(body?.username || '');
    if (username) client.join(`user:${username}`);
    return { ok: true };
  }

  emitNotification(notification: any) {
    this.server.to(`user:${notification.recipient_username}`).emit('notification:new', notification);
  }

  emitUnreadCount(username: string, unread: number) {
    this.server.to(`user:${username}`).emit('notification:unread_count', { unread });
  }
}
