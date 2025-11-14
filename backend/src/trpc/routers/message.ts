import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

/**
 * Emits 'message:new' events when new messages are created.
 */
const messageEvents = new EventEmitter();

/**
 * Structure of a new message event.
 */
interface NewMessageEvent {
  threadId: number;
  message: {
    id: number;
    threadId: number;
    senderId: number;
    content: string;
    createdAt: Date;
    sender: {
      id: number;
      username: string;
    };
  };
}

/**
 * Message router handling message operations and real-time subscriptions.
 */
export const messageRouter = router({
  /**
   * Lists all messages in a thread.
   * Verifies that the user is a participant before returning messages.
   * 
   * @input threadId - The ID of the thread
   * @returns Array of messages in chronological order
   * @throws FORBIDDEN if user is not a participant in the thread
   */
  list: protectedProcedure
    .input(
      z.object({
        threadId: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { threadId } = input;

      // Verify user is a participant in this thread
      const participant = await ctx.prisma.threadParticipant.findFirst({
        where: {
          threadId,
          userId: ctx.user.userId,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this thread',
        });
      }

      // Fetch messages
      const messages = await ctx.prisma.message.findMany({
        where: { threadId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return messages;
    }),

  /**
   * Creates a new message in a thread.
   * Verifies user is a participant and emits real-time event.
   * 
   * @input threadId - The ID of the thread
   * @input content - The message content (1-5000 characters)
   * @returns The created message
   * @throws FORBIDDEN if user is not a participant in the thread
   */
  create: protectedProcedure
    .input(
      z.object({
        threadId: z.number().int().positive(),
        content: z.string().min(1).max(5000, 'Message too long'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { threadId, content } = input;

      // Verify user is a participant in this thread
      const participant = await ctx.prisma.threadParticipant.findFirst({
        where: {
          threadId,
          userId: ctx.user.userId,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this thread',
        });
      }

      // Create message
      const message = await ctx.prisma.message.create({
        data: {
          threadId,
          senderId: ctx.user.userId,
          content,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Emit event for real-time updates
      messageEvents.emit('message:new', {
        threadId,
        message,
      } as NewMessageEvent);

      return message;
    }),

  /**
   * Subscribes to new messages in a specific thread.
   * Provides real-time updates when new messages are created.
   * 
   * @input threadId - The ID of the thread to subscribe to
   * @returns Observable stream of new messages
   * @throws FORBIDDEN if user is not a participant in the thread
   */
  onNew: protectedProcedure
    .input(
      z.object({
        threadId: z.number().int().positive(),
      })
    )
    .subscription(async ({ input, ctx }) => {
      const { threadId } = input;

      // Verify user is a participant in this thread
      const participant = await ctx.prisma.threadParticipant.findFirst({
        where: {
          threadId,
          userId: ctx.user.userId,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this thread',
        });
      }

      // Return observable that emits new messages for this thread
      return observable<NewMessageEvent['message']>((emit) => {
        const onMessage = (data: NewMessageEvent) => {
          if (data.threadId === threadId) {
            emit.next(data.message);
          }
        };

        messageEvents.on('message:new', onMessage);

        // Cleanup on unsubscribe
        return () => {
          messageEvents.off('message:new', onMessage);
        };
      });
    }),
});
