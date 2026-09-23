import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

const SIGNALR_URL = 'http://localhost:5254/hubs/auction';

export interface BidPayload {
  bidder: string;
  userId?: string;
  amount: number;
  time: string;
  currentPrice: number;
}

export async function createAuctionConnection(
  listingId: string
): Promise<HubConnection> {
  const connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  await connection.start();
  await connection.invoke('JoinAuction', listingId);

  return connection;
}

export async function destroyAuctionConnection(
  connection: HubConnection,
  listingId: string
): Promise<void> {
  if (connection.state === HubConnectionState.Connected) {
    try {
      await connection.invoke('LeaveAuction', listingId);
    } catch {
    }
    await connection.stop();
  }
}

export async function createConversationConnection(listingId: string): Promise<HubConnection> {
  const connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
  await connection.start();
  await connection.invoke('JoinConversation', listingId);
  return connection;
}

export async function destroyConversationConnection(connection: HubConnection, listingId: string): Promise<void> {
  if (connection.state === HubConnectionState.Connected) {
    try { await connection.invoke('LeaveConversation', listingId); } catch { /* already disconnected */ }
    await connection.stop();
  }
}

export async function createConversationInboxConnection(): Promise<HubConnection> {
  const connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
  await connection.start();
  await connection.invoke('JoinConversationInbox');
  return connection;
}

export async function destroyConversationInboxConnection(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Connected) {
    try { await connection.invoke('LeaveConversationInbox'); } catch { /* already disconnected */ }
    await connection.stop();
  }
}
