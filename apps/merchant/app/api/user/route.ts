import { NextResponse } from "next/server";
import db from "@repo/db/client";

export const GET = async () => {
  const allMerchants = await db.merchant.findMany();

  return NextResponse.json({
    data: allMerchants,
  });
};
