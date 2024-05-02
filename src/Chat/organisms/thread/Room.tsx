import React from "react"
import "./Room.scss"
import { Room } from "matrix-js-sdk"
import { Line } from "folds"

import ThreadView from "./ThreadView"
import RoomSettings from "./RoomSettings"
import { MembersDrawer } from "./MembersDrawer"
import { ScreenSize, useScreenSize } from "../../hooks/useScreenSize"
import { useSetting } from "../../state/hooks/settings"
import { settingsAtom } from "../../state/settings"
import {
  PowerLevelsContextProvider,
  usePowerLevels
} from "../../hooks/usePowerLevels"
import {
  roomIdToTypingMembersAtom,
  useBindRoomIdToTypingMembersAtom
} from "../../state/typingMembers"

export type RoomBaseViewProps = {
  room: Room
  eventId?: string
}
export function RoomBaseView({ room, eventId }: RoomBaseViewProps) {
  useBindRoomIdToTypingMembersAtom(room.client, roomIdToTypingMembersAtom)

  const [isDrawer] = useSetting(settingsAtom, "isPeopleDrawer")
  const [screenSize] = useScreenSize()
  const powerLevelAPI = usePowerLevels(room)
  return (
    <PowerLevelsContextProvider value={powerLevelAPI}>
      <div className="room">
        <div className="room__content">
          {/* <RoomSettings roomId={room.roomId} /> */}
          <ThreadView room={room} eventId={eventId} />
        </div>
      </div>
    </PowerLevelsContextProvider>
  )
}
