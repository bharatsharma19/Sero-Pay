import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransaction";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getBalance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // User does not exist, return default values or throw an error
    return { amount: 0, locked: 0 };
  }
  const userExists = await prisma.user.findFirst({
    where: {
      id: Number(session?.user?.id),
    },
  });
  if (!userExists) {
    // User does not exist, return default values or throw an error
    return { amount: 0, locked: 0 };
  }
  const balance = await prisma.balance.findFirst({
    where: {
      userId: Number(session?.user?.id),
    },
  });
  return {
    amount: balance?.amount || 0,
    locked: balance?.locked || 0,
  };
}

async function getOnRampTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // User does not exist, return default values or throw an error
    return [
      {
        time: new Date(),
        amount: 0,
        status: "None", // <--- changed to string
        provider: "None",
      },
    ];
  }
  const userExists = await prisma.user.findFirst({
    where: {
      id: Number(session?.user?.id),
    },
  });
  if (!userExists) {
    // User does not exist, return default values or throw an error
    return [
      {
        time: new Date(),
        amount: 0,
        status: "None", // <--- changed to string
        provider: "None",
      },
    ];
  }
  const txns = await prisma.onRampTransaction.findMany({
    where: {
      userId: Number(session?.user?.id),
    },
  });
  return txns.map((t: any) => ({
    time: t.startTime,
    amount: t.amount,
    status: t.status.toString(), // <--- converted to string
    provider: t.provider,
  }));
}

export default async function () {
  const balance = await getBalance();
  const transactions = await getOnRampTransactions();

  return (
    <div className="w-screen">
      <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
        Transfer
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
        <div>
          <AddMoney />
        </div>
        <div>
          <BalanceCard amount={balance.amount} locked={balance.locked} />
          <div className="pt-4">
            <OnRampTransactions transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
