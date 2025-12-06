import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/conversations/:conversationId/messages
 * @desc Get message history for a conversation
 * @access Private
 */
router.get(
  '/:conversationId/messages',
  authMiddleware,
  async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Verify user has access to this conversation
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Get messages with pagination
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: {
            conversationId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip,
        }),
        prisma.message.count({
          where: {
            conversationId,
          },
        }),
      ]);

      // Sort messages in ascending order (oldest first)
      const sortedMessages = messages.reverse();

      return res.json({
        messages: sortedMessages,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @route POST /api/conversations/:conversationId/messages
 * @desc Send a new message in a conversation
 * @access Private
 */
router.post(
  '/:conversationId/messages',
  authMiddleware,
  async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Verify user has access to this conversation
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Create new message
      const message = await prisma.message.create({
        data: {
          content,
          senderId: userId,
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true,
            },
          },
        },
      });

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ message: 'Error sending message' });
    }
  }
);

export default router;
