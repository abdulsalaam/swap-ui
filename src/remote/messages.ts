import { IAPIMessages } from "src/interfaces/api/messages";
import APIClass, { IAPIClassCallProps } from "./remote.api.base";
import { IAPIData, IAnswerError } from "src/interfaces/api";
import { IMessage, IMessageType } from "src/models/message";
import { IIMessageServer } from "./interfaces";

export default class APIMessages extends APIClass implements IAPIMessages {
  private getMessagesURL: string;
  constructor(data: IAPIData) {
    super(data);
    const p: string = "/api/messages/";
    this.getMessagesURL = p + "getMessages";
  }

  public async Get(lastID: number, chatID: number): Promise<IAnswerError | IMessage[]> {
    const message: IAPIClassCallProps = super.GetDefaultMessage();
    message.uri = this.getMessagesURL;
    message.payload = {
      ...message.payload,
      last_index: lastID,
      chat_id: chatID,
    };
    const messagesAnswer: IAnswerError | IIMessageServer[] = await super.Send(message);
    const messages: IMessage[] = [];
    if ((messagesAnswer as IAnswerError).result !== "Error") {
      (messagesAnswer as IIMessageServer[]).forEach((e: IIMessageServer) => {
        messages.push({
          AuthorID: e.author_id,
          AuthorName: e.author_login,
          Content: {
            Documents: e.message.documents,
            Message: e.message.content,
            Type: (e.message.type === "u_msg" ? IMessageType.User : IMessageType.System),
          },
          Time: e.time,
          ChatID: e.chat_id,
          ID: e.id,
        });
      });
      return messages;
    } else {
      return (messagesAnswer as IAnswerError);
    }
  //
  }
}