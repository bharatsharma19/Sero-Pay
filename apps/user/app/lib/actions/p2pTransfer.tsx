"use server";

import prisma from "@repo/db/client";
import { authOptions } from "../auth";
import { getServerSession } from "next-auth";

export async function p2pTransfer(to: string, amount: number) {
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "Error while sending",
        };
    }

    // Find the recipient user
    const toUser = await prisma.user.findFirst({
        where: { number: to },
    });

    if (!toUser) {
        return {
            message: "User not found",
        };
    }

    // Begin transaction
    await prisma.$transaction(async (tx) => {
        // Lock the balance for the sender
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

        // Check and create a balance record for the sender if it doesn't exist
        let fromBalance = await tx.balance.findUnique({
            where: { userId: Number(from) },
        });
        if (!fromBalance) {
            fromBalance = await tx.balance.create({
                data: {
                    userId: Number(from),
                    amount: 0,  // Initial balance for the sender
                    locked: 0,
                },
            });
        }

        // Ensure sufficient funds
        if (fromBalance.amount < amount) {
            throw new Error('Insufficient funds');
        }

        // Check and create a balance record for the recipient if it doesn't exist
        let toBalance = await tx.balance.findUnique({
            where: { userId: toUser.id },
        });
        if (!toBalance) {
            toBalance = await tx.balance.create({
                data: {
                    userId: toUser.id,
                    amount: 0,  // Initial balance for the recipient
                    locked: 0,
                },
            });
        }

        // Deduct the amount from the sender's balance
        await tx.balance.update({
            where: { userId: Number(from) },
            data: { amount: { decrement: amount } },
        });

        // Add the amount to the recipient's balance
        await tx.balance.update({
            where: { userId: toUser.id },
            data: { amount: { increment: amount } },
        });

        // Log the transfer
        await tx.p2pTransfer.create({
            data: {
                fromUserId: Number(from),
                toUserId: toUser.id,
                amount,
                timestamp: new Date(),
            },
        });
    });
}
