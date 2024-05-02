import React, { useContext, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import ChatWrapperContext from "./ChatWrapper2Context"

const ChatRoute = () => {
  const { showChat, setShowChat } = useContext(ChatWrapperContext)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname?.includes("chat")) {
      setShowChat(true)
    } else {
      setShowChat(false)
    }

    return () => {
      setShowChat(false)
    }
  }, [location])

  return <></>
}

export default ChatRoute
