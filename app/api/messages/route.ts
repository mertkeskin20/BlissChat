import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import CryptoJS from 'crypto-js';


const key = CryptoJS.lib.WordArray.random(256 / 8); // random 256-bit key (32 bytes)

const iv = CryptoJS.lib.WordArray.random(128 / 8); // random 128-bit IV (16 bytes)

async function encryptMessage(message: string) {
    return CryptoJS.AES.encrypt(message, key, { iv: iv }).toString();
}

async function decryptMessage(ciphertext: string) {
    return CryptoJS.AES.decrypt(ciphertext, key, { iv: iv }).toString(CryptoJS.enc.Utf8);
}


export async function POST(
    request: Request
) {
    try {
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const {
            message,
            image,
            conversationId
        } = body;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const encryptedMessage = await encryptMessage(message);
        console.log('encryptedMessage:', encryptedMessage); // Şifrelenmiş mesajı konsola yazdır

        const decryptedMessage = await decryptMessage(encryptedMessage);
        console.log('decryptedMessage:', decryptedMessage); // çözülmüş mesajı konsola yazdır

        const newMessage = await prisma.message.create({
            data: {
                body: message,
                ciphertext: encryptedMessage,
                decrypted: decryptedMessage,
                image: image,
                conversation: {
                    connect: {
                        id: conversationId
                    }
                },
                sender: {
                    connect: {
                        id: currentUser.id
                    }
                },
                seen: {
                    connect: {
                        id: currentUser.id
                    }
                }
            },
            include: {
                seen: true,
                sender: true,
            }
        });

        const updatedConversation = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messages: {
                    connect: {
                        id: newMessage.id
                    }
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true
                    }
                }
            }
        });

        await pusherServer.trigger(conversationId, 'messages:new', newMessage);

        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        updatedConversation.users.map((user) => {
            pusherServer.trigger(user.email!, 'conversation:update', {
                id: conversationId,
                messages: [lastMessage]
            })
        });

        return NextResponse.json(newMessage);

    } catch (error: any) {
        console.log(error, 'ERROR_MESSAGES');
        return new NextResponse('InternalError', { status: 500 });
    }

}