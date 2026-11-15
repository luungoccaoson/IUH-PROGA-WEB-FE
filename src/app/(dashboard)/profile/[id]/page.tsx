"use client";

import React from "react";
import { useParams } from "next/navigation";
import { UserProfileView } from "@/components/profile/UserProfileView";

export default function MemberProfilePage() {
  const params = useParams();
  const userId = params?.id ? parseInt(params.id as string, 10) : undefined;

  return <UserProfileView targetUserId={userId} />;
}
