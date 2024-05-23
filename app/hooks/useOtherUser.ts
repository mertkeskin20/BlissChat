import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { FullConversationType } from "../types";
import { User } from "@prisma/client";

const useOtherUser = (conversation: FullConversationType | { users: User[] }) => {
  const { data: session } = useSession();

  const otherUser = useMemo(() => {
    const currentUserEmail = session?.user?.email;

    if (!currentUserEmail || !conversation.users) {
      return null; // Handle case where session or conversation.users is undefined
    }

    const otherUsers = conversation.users.filter((user) => user.email !== currentUserEmail);

    return otherUsers.length > 0 ? otherUsers[0] : null; // Handle case where no other user is found
  }, [session?.user?.email, conversation.users]);

  return otherUser;
};

export default useOtherUser;
