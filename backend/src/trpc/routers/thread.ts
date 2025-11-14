import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';

/**
 * Thread router handling thread creation and retrieval.
 */
export const threadRouter = router({
  /**
   * Lists all threads for the authenticated user.
   * Returns threads with participant info and last message.
   * 
   * @returns Array of threads with participants and last message
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const threads = await ctx.prisma.thread.findMany({
      where: {
        participants: {
          some: {
            userId: ctx.user.userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to include other participant and last message
    return threads.map((thread) => {
      const otherParticipant = thread.participants.find(
        (p) => p.userId !== ctx.user.userId
      );

      return {
        id: thread.id,
        createdAt: thread.createdAt,
        otherUser: otherParticipant?.user || null,
        lastMessage: thread.messages[0] || null,
      };
    });
  }),

  /**
   * Creates a new thread with another user.
   * Prevents duplicate threads between the same two users.
   * 
   * @input otherUsername - Username of the other participant
   * @returns The created thread with participant information
   * @throws NOT_FOUND if other user doesn't exist
   * @throws BAD_REQUEST if trying to create thread with self or duplicate thread
   */
  create: protectedProcedure
    .input(
      z.object({
        otherUsername: z.string().min(1, 'Username is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { otherUsername } = input;

      // Prevent creating thread with self
      if (otherUsername === ctx.user.username) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot create a thread with yourself',
        });
      }

      // Find the other user
      const otherUser = await ctx.prisma.user.findUnique({
        where: { username: otherUsername },
      });

      if (!otherUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User '${otherUsername}' not found`,
        });
      }

      // Check if thread already exists between these two users
      const existingThread = await ctx.prisma.thread.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: ctx.user.userId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: otherUser.id,
                },
              },
            },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (existingThread) {
        // Return existing thread instead of creating duplicate
        const otherParticipant = existingThread.participants.find(
          (p) => p.userId !== ctx.user.userId
        );

        return {
          id: existingThread.id,
          createdAt: existingThread.createdAt,
          otherUser: otherParticipant?.user || null,
        };
      }

      // Create new thread
      const thread = await ctx.prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: ctx.user.userId },
              { userId: otherUser.id },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      const otherParticipant = thread.participants.find(
        (p) => p.userId !== ctx.user.userId
      );

      return {
        id: thread.id,
        createdAt: thread.createdAt,
        otherUser: otherParticipant?.user || null,
      };
    }),
});
