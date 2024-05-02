import React, { useState, useEffect, useRef, useContext } from "react"
import "./Client.scss"

// import VerticalMenuIC from "../../public/res/ic/outlined/vertical-menu.svg"
import { ClientContent } from "./ClientContent"
import ChatWrapperContext from "../../ChatWrapper2/ChatWrapper2Context"
import Navigation from "../../organisms/navigation/Navigation"

function Client() {
  const { navWrapperRef, roomWrapperRef } = useContext(ChatWrapperContext)
  const classNameHidden = "client__item-hidden"

  return (
    <div className="client-container">
      {/* <div className="navigation__wrapper" ref={navWrapperRef}>
        <Navigation />
      </div> */}
      <div className={`room__wrapper ${classNameHidden}`} ref={roomWrapperRef}>
        <ClientContent />
      </div>
    </div>
  )
}

export default Client
