import React, { useContext, useEffect, useState } from "react"
import PropTypes from "prop-types"
import "./RoomsCategory.scss"

import initMatrix from "../../client/initMatrix"
import {
  selectSpace,
  selectRoom,
  openReusableContextMenu
} from "../../client/action/navigation"
import { getEventCords } from "../../util/common"

import Text from "../../atoms/text/Text"
import RawIcon from "../../atoms/system-icons/RawIcon"
import IconButton from "../../atoms/button/IconButton"
import Selector from "./Selector"
import SpaceOptions from "../../molecules/space-options/SpaceOptions"
import { HomeSpaceOptions } from "./DrawerHeader"

import PlusIC from "../../public/res/ic/outlined/plus.svg"
import HorizontalMenuIC from "../../public/res/ic/outlined/horizontal-menu.svg"
import ChevronBottomIC from "../../public/res/ic/outlined/chevron-bottom.svg"
import ChevronRightIC from "../../public/res/ic/outlined/chevron-right.svg"
import ScrollView from "../../atoms/scroll/ScrollView"
import ChatWrapperContext from "../../ChatWrapper2/ChatWrapper2Context"

function RoomsCategory({ spaceId, name, hideHeader, roomIds, drawerPostie }) {
  const { spaces, favouritesDM } = initMatrix.roomList
  const [isOpen, setIsOpen] = useState({
    pinned: true,
    chat: true
  })
  const { setIsThreadOpen, setThreadEventId } = useContext(ChatWrapperContext)
  const openSpaceOptions = (e) => {
    e.preventDefault()
    openReusableContextMenu(
      "bottom",
      getEventCords(e, ".header"),
      (closeMenu) => (
        <SpaceOptions roomId={spaceId} afterOptionSelect={closeMenu} />
      )
    )
  }

  const openHomeSpaceOptions = (e) => {
    e.preventDefault()
    openReusableContextMenu(
      "right",
      getEventCords(e, ".ic-btn"),
      (closeMenu) => (
        <HomeSpaceOptions spaceId={spaceId} afterOptionSelect={closeMenu} />
      )
    )
  }

  const renderSelector = (roomId) => {
    const isSpace = spaces.has(roomId)
    const select = (roomId) => {
      setIsThreadOpen(false)
      setThreadEventId("")
      isSpace ? selectSpace(roomId) : selectRoom(roomId)
      return
    }

    return (
      <Selector
        key={roomId}
        roomId={roomId}
        drawerPostie={drawerPostie}
        onClick={() => {
          if (name == "Chats" || favouritesDM.has(roomId)) {
            localStorage.setItem("dm_roomid", roomId)
          } else {
            localStorage.setItem("channel_roomid", roomId)
          }
          return select(roomId)
          // return isSpace ? selectSpace(roomId) : selectRoom(roomId)
        }}
      />
    )
  }

  return (
    <div className="room-category">
      {name === "Pinned" ? (
        <>
          {!hideHeader && (
            <div className="room-category__header">
              <button
                className="room-category__toggle"
                onClick={() =>
                  setIsOpen((prev) => ({ ...prev, pinned: !prev.pinned }))
                }
                type="button"
              >
                <RawIcon
                  src={isOpen.pinned ? ChevronBottomIC : ChevronRightIC}
                  size="extra-small"
                />
                <Text className="cat-header" variant="b3" weight="medium">
                  {name}
                </Text>
              </button>
              {spaceId && (
                <IconButton
                  onClick={openSpaceOptions}
                  tooltip="Space options"
                  src={HorizontalMenuIC}
                  size="extra-small"
                />
              )}
              {spaceId && (
                <IconButton
                  onClick={openHomeSpaceOptions}
                  tooltip="Add rooms/spaces"
                  src={PlusIC}
                  size="extra-small"
                />
              )}
            </div>
          )}
          {(isOpen.pinned || hideHeader) && (
            <div className="room-category__content">
              {roomIds.map(renderSelector)}
            </div>
          )}
        </>
      ) : (
        <>
          {!hideHeader && (
            <div className="room-category__header">
              <button
                className="room-category__toggle"
                onClick={() =>
                  setIsOpen((prev) => ({ ...prev, chat: !prev.chat }))
                }
                type="button"
              >
                <RawIcon
                  src={isOpen.chat ? ChevronBottomIC : ChevronRightIC}
                  size="extra-small"
                />
                <Text className="cat-header" variant="b3" weight="medium">
                  {name}
                </Text>
              </button>
              {spaceId && (
                <IconButton
                  onClick={openSpaceOptions}
                  tooltip="Space options"
                  src={HorizontalMenuIC}
                  size="extra-small"
                />
              )}
              {spaceId && (
                <IconButton
                  onClick={openHomeSpaceOptions}
                  tooltip="Add rooms/spaces"
                  src={PlusIC}
                  size="extra-small"
                />
              )}
            </div>
          )}
          {(isOpen.chat || hideHeader) && (
            <div className="room-category__content">
              {roomIds.map(renderSelector)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
RoomsCategory.defaultProps = {
  spaceId: null,
  hideHeader: false
}
RoomsCategory.propTypes = {
  spaceId: PropTypes.string,
  name: PropTypes.string.isRequired,
  hideHeader: PropTypes.bool,
  roomIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  drawerPostie: PropTypes.shape({}).isRequired
}

export default RoomsCategory
