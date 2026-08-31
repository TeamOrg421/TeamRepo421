import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

const SIGNALR_URL = 'http://localhost:5254/hubs/auction';

/**
 * Payload broadcasted by the server on every new bid.
 */
export interface BidPayload {
  bidder: string;
  amount: number;
  time: string;
  currentPrice: number;
}

/**
 * Builds, starts and returns a SignalR HubConnection that is
 * already joined to the group for the given auctionListingId.
 *
 * The caller is responsible for calling connection.stop() on cleanup.
 */
export async function createAuctionConnection(
  listingId: string
): Promise<HubConnection> {
  const token = localStorage.getItem('token');

  const connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      // Forward the JWT so the hub can optionally authorise the connection
      accessTokenFactory: () => token ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  await connection.start();

  // Join the group dedicated to this auction listing
  await connection.invoke('JoinAuction', listingId);

  return connection;
}

/**
 * Gracefully leaves the auction group and stops the connection.
 */
export async function destroyAuctionConnection(
  connection: HubConnection,
  listingId: string
): Promise<void> {
  if (connection.state === HubConnectionState.Connected) {
    try {
      await connection.invoke('LeaveAuction', listingId);
    } catch {
      // Ignore — we're tearing down anyway
    }
    await connection.stop();
  }
}
