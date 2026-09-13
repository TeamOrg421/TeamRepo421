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
  const token = localStorage.getItem('token');

  const connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      accessTokenFactory: () => token ?? '',
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
