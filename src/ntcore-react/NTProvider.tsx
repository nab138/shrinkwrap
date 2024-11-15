import { useEffect, useState, useRef } from "react";
import {
  NetworkTables,
  NetworkTablesTypeInfo,
  NetworkTablesTypeInfos,
} from "ntcore-ts-client";
import NTContext, { TopicInfo } from "./NTContext";

export const NetworkTablesTypeInfosLookup = {
  boolean: NetworkTablesTypeInfos.kBoolean,
  double: NetworkTablesTypeInfos.kDouble,
  int: NetworkTablesTypeInfos.kInteger,
  float: [3, "float"] as NetworkTablesTypeInfo,
  string: NetworkTablesTypeInfos.kString,
  raw: NetworkTablesTypeInfos.kArrayBuffer,
  "boolean[]": NetworkTablesTypeInfos.kBooleanArray,
  "double[]": NetworkTablesTypeInfos.kDoubleArray,
  "int[]": NetworkTablesTypeInfos.kIntegerArray,
  "string[]": NetworkTablesTypeInfos.kStringArray,
};

type NTProviderProps = {
  children?: React.ReactNode;
  port?: number;
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
  port,
}: NTProviderProps) {
  const [ntConnection, setNtConnection] = useState<NetworkTables | null>(null);
  const [
    ntConnectionCreatedUsingTeamNumber,
    setNtConnectionCreatedUsingTeamNumber,
  ] = useState<boolean>(false);
  const [topics, setTopics] = useState<TopicInfo[]>([]);

  const oldTeamNumber = useRef<number | undefined>();

  useEffect(() => {
    // Create a network tables connection if one doesn't exist
    // Otherwise, reconnect using the uri, or throw an error if a team number is provided
    if (ntConnection === null) {
      if (uri) {
        setNtConnection(NetworkTables.getInstanceByURI(uri, port));
        setNtConnectionCreatedUsingTeamNumber(false);
      } else if (teamNumber) {
        setNtConnection(NetworkTables.getInstanceByTeam(teamNumber, port));
        setNtConnectionCreatedUsingTeamNumber(true);
        oldTeamNumber.current = teamNumber;
      } else {
        throw new Error(
          "Either a uri or a team number must be provided to create a network tables connection"
        );
      }
    } else if (uri) {
      ntConnection.changeURI(uri, port);
      setNtConnectionCreatedUsingTeamNumber(false);
    } else if (
      teamNumber !== oldTeamNumber.current &&
      ntConnectionCreatedUsingTeamNumber
    ) {
      throw new Error(
        "There is currently no support for changing a team number after the connection has been created. Use a uri instead."
      );
    } else {
      throw new Error(
        "Either a uri or a team number must be provided to create a network tables connection"
      );
    }
  }, [uri, teamNumber, port]);

  useEffect(() => {
    if (ntConnection === null) return;
    const allTopics = ntConnection.createPrefixTopic("/");

    let id = allTopics?.subscribe(
      (_, params) => {
        if (params.name.includes("Robot Pos")) console.log(_);
        const topic = {
          name: params.name,
          type: NetworkTablesTypeInfosLookup[
            params.type as keyof typeof NetworkTablesTypeInfosLookup
          ],
        };
        setTopics((prev) => {
          if (prev.some((t) => t.name === topic.name)) {
            return prev;
          } else {
            return [...prev, topic];
          }
        });
      },
      {
        periodic: 3,
      }
    );
    return () => {
      allTopics.unsubscribe(id);
    };
  }, [ntConnection]);

  return (
    <NTContext.Provider value={{ client: ntConnection, topics }}>
      {ntConnection ? children : null}
    </NTContext.Provider>
  );
}
