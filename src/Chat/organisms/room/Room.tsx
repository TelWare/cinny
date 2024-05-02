import React, { useContext } from "react"
import "./Room.scss"
import { Room } from "matrix-js-sdk"
import { Line } from "folds"

import RoomView from "./RoomView"
import ThreadView from "../thread/ThreadView"
import RoomSettings from "./RoomSettings"
import { MembersDrawer } from "./MembersDrawer"
import { ScreenSize, useScreenSize } from "../../hooks/useScreenSize"
import { useSetSetting, useSetting } from "../../state/hooks/settings"
import { settingsAtom } from "../../state/settings"
import {
  PowerLevelsContextProvider,
  usePowerLevels
} from "../../hooks/usePowerLevels"
import {
  roomIdToTypingMembersAtom,
  useBindRoomIdToTypingMembersAtom
} from "../../state/typingMembers"
import ChatWrapperContext from "../../ChatWrapper2/ChatWrapper2Context"

export type RoomBaseViewProps = {
  room: Room
  eventId?: string
}
export function RoomBaseView({ room, eventId }: RoomBaseViewProps) {
  useBindRoomIdToTypingMembersAtom(room.client, roomIdToTypingMembersAtom)

  const [isDrawer] = useSetting(settingsAtom, "isPeopleDrawer")
  const { isThreadOpen, setIsThreadOpen, threadEventId } =
    useContext(ChatWrapperContext)

  const [screenSize] = useScreenSize()
  const powerLevelAPI = usePowerLevels(room)
  console.log({ threadEventId })
  if (!threadEventId) setIsThreadOpen(false)
  return (
    <PowerLevelsContextProvider value={powerLevelAPI}>
      <div className="room">
        <div className="room__content">
          <RoomSettings roomId={room.roomId} />
          <RoomView room={room} eventId={eventId} />
        </div>

        {screenSize === ScreenSize.Desktop && isDrawer && (
          <>
            <Line variant="Background" direction="Vertical" size="300" />
            <MembersDrawer key={room.roomId} room={room} />
          </>
        )}

        {screenSize === ScreenSize.Desktop && isThreadOpen && threadEventId && (
          <>
            <Line variant="Background" direction="Vertical" size="300" />
            {/* <MembersDrawer key={room.roomId} room={room} /> */}
            <div className="room__content">
              <ThreadView room={room} eventId={threadEventId} />
            </div>
          </>
        )}
      </div>
    </PowerLevelsContextProvider>
  )
}
