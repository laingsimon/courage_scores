// see CourageScores.Models.Dtos.Live.WebSocketDto
export interface IWebSocketDto {
    id: string;
    originatingUrl?: string;
    userName?: string;
    connected?: string;
    lastReceipt?: string;
    lastSent?: string;
    subscriptions?: string[];
    receivedMessages?: number;
    sentMessages?: number;
}
