import { useEffect, useState, useRef } from "react";
import NTContext from "./NTContext";
import { NTClient } from "./NT4UserFriendly";

type NTProviderProps = {
  children?: React.ReactNode;
  teamNumber?: number;
  uri?: string;
};

/**
 * Used to give the rest of the application access to the network tables connection. This component should be placed at the top of the component tree.
 * Pass in either a uri or a team number to create a network tables connection. If a uri is provided, the connection will be created using that uri. If a team number is provided, the connection will be created using the team number. If a uri is provided, the team number will be ignored.
 *
 * @param uri The uri of the network tables server
 * @param teamNumber The team number of the network tables server
 * @param port The port of the network tables server. Defaults to 5810
 * @returns
 */
export default function NTProvider({
  children = null,
  uri,
  teamNumber,
}: NTProviderProps) {
  const [ntConnection, setNtConnection] = useState<NTClient | null>(null);
  const oldTeamNumber = useRef<number | undefined>();

  useEffect(() => {
    // Create a network tables connection if one doesn't exist
    // Otherwise, reconnect using the uri, or throw an error if a team number is provided
    if (uri) {
      setNtConnection(NTClient.getInstanceByURI(uri));
    } else if (teamNumber) {
      setNtConnection(NTClient.getInstanceByTeam(teamNumber));
      oldTeamNumber.current = teamNumber;
    } else {
      throw new Error(
        "Either a uri or a team number must be provided to create a network tables connection"
      );
    }

    return () => {
      if (ntConnection) {
        ntConnection.disconnect();
      }
    };
  }, [uri, teamNumber]);

  useEffect(() => {
    if (ntConnection === null) return;
    const allTopics = ntConnection.subscribeRoot();
    return () => {
      allTopics.unsubscribe();
    };
  }, [ntConnection]);

  return (
    <NTContext.Provider value={ntConnection}>
      {ntConnection ? children : null}
    </NTContext.Provider>
  );
}
