import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Socket } from 'socket.io';

interface MessageData {
  content: string;
  senderId: string;
  conversationId: string;
}

export const initializeSocket = (io: Server, prisma: PrismaClient) => {
  io.on('connection', (socket: Socket) => {
    // Join a conversation
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
    });

    // Handle typing indicator
    socket.on('typing', (data: { conversationId: string; userId: string }) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: data.userId,
        isTyping: true,
      });
    });

    socket.on('stop_typing', (data: { conversationId: string; userId: string }) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: data.userId,
        isTyping: false,
      });
    });

    // Send and receive messages
    socket.on('send_message', async (data: MessageData) => {
      try {
        const { content, senderId, conversationId } = data;
        
        // Save message to database
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            conversationId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        });

        // Emit to all clients in the conversation room
        io.to(conversationId).emit('receive_message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Handle disconnection
    });
  });
};

export default initializeSocket;
