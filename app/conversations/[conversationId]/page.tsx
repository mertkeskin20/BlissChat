import getConversationById from "@/app/actions/getConversationById";
import getMessages from "@/app/actions/getMessages";
import EmptyState from "@/app/components/EmptyState";
import Header from "./components/Header";
import Body from "./components/Body";
import Form from "./components/Form";

interface IParams {
    conversationId: string
};

const ConversationId = async ({ params }: {params: IParams}) => {
    const conversation = await getConversationById(params.conversationId);
    const messages = await getMessages(params.conversationId);


    if(!conversation) {
        return (
            <div className = "lg:pl-80 h-full">
                <div className= 'h-full flex flex-col'>
                    <EmptyState />
                </div>

            </div>
        );
    }


    return (
        <div className="lg:pl-80 h-full">
            <div className = "h-full flex flex-col"
            style={{
                backgroundImage: `url('/images/msgbackground.jpg')`,
                backgroundSize: "cover", // Resmin kaplamasını sağlar
                backgroundPosition: "center", // Resmin ortalanmasını sağlar
                //backgroundColor: "rgba(0, 0, 0, 1)", // Siyah arka planın %50 opaklığı
              }}>
                <Header conversation={conversation} />
                <Body initialMessages = {messages} />
                <Form />
            </div>
        </div>
    )
    
};

export default ConversationId;

