import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { FeatureCheck } from './FeatureCheck';
import { ClientConfigLoader } from '../components/ClientConfigLoader';
import { ConfigConfigError, ConfigConfigLoading } from './ConfigConfig';
import { ClientConfigProvider } from '../hooks/useClientConfig';
import { Provider as JotaiProvider } from 'jotai';
import '../index.scss';

import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';
import settings from '../client/state/settings';
import { ChatWrapperProvider } from './ChatWrapper2Context';
import navigation from '../../Chat/client/state/navigation';
import cons from '../../Chat/client/state/cons';
import { initHotkeys } from '../../Chat/client/event/hotkeys';
import { initRoomListListener } from '../../Chat/client/event/roomList';
import Text from '../../Chat/atoms/text/Text';
import Spinner from '../../Chat/atoms/spinner/Spinner';
import ContextMenu, { MenuItem } from '../../Chat/atoms/context-menu/ContextMenu';
import IconButton from '../../Chat/atoms/button/IconButton';
import initMatrix from '../../Chat/client/initMatrix';
import {
  toggleSystemTheme,
  toggleNotifications,
  toggleNotificationSounds,
} from '../../Chat/client/action/settings';
import { MatrixClientProvider } from '../hooks/useMatrixClient';
import ReusableContextMenu from '../../Chat/atoms/context-menu/ReusableContextMenu';
import Windows from '../../Chat/organisms/pw/Windows';
import Dialogs from '../../Chat/organisms/pw/Dialogs';
import { useSetting } from '../state/hooks/settings';
import { useSelectedTab } from '../hooks/useSelectedTab';
import { settingsAtom } from '../state/settings';
import Client from '../templates/client/Client';
import { useLocation, useNavigate } from 'react-router-dom';

document.body.classList.add(configClass, varsClass);
settings.applyTheme();

function SystemEmojiFeature() {
  const [twitterEmoji] = useSetting(settingsAtom, 'twitterEmoji');

  if (twitterEmoji) {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji');
  } else {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji_DISABLED');
  }

  return null;
}

const ChatWrapper2 = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [selectedTab] = useSelectedTab();
  const classNameHidden = 'client__item-hidden';

  const navWrapperRef = useRef(null);
  const roomWrapperRef = useRef(null);

  function onRoomSelected() {
    navWrapperRef.current?.classList.add(classNameHidden);
    roomWrapperRef.current?.classList.remove(classNameHidden);
  }
  function onNavigationSelected() {
    navWrapperRef.current?.classList.remove(classNameHidden);
    roomWrapperRef.current?.classList.add(classNameHidden);
  }

  useEffect(() => {
    navigation.on(cons.events.navigation.ROOM_SELECTED, onRoomSelected);
    navigation.on(cons.events.navigation.NAVIGATION_OPENED, onNavigationSelected);

    return () => {
      navigation.removeListener(cons.events.navigation.ROOM_SELECTED, onRoomSelected);
      navigation.removeListener(cons.events.navigation.NAVIGATION_OPENED, onNavigationSelected);
    };
  }, []);

  const [isChatLoading, changeLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Heating up');
  const [selectedUser, setSelectedUser] = useState([]);
  const [, updateState] = useState({});
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [threadEventId, setThreadEventId] = useState('');
  const [isErrorState, setIsErrorState] = useState(false);
  const [dmNoti, setDmNoti] = useState({});
  const [homeNoti, setHomeNoti] = useState({});
  const { roomList } = initMatrix;
  const [totalInvites, setTotalInvites] = useState(0);
  // roomList?.inviteRooms.size +
  //   roomList?.inviteSpaces.size +
  //   roomList?.inviteDirects.size

  useEffect(() => {
    changeLoading(true);
    let counter = 0;
    const iId = setInterval(() => {
      const msgList = ['Almost there...', 'Looks like you have a lot of stuff to heat up!'];
      if (counter === msgList.length - 1) {
        setLoadingMsg(msgList[msgList.length - 1]);
        clearInterval(iId);
        return;
      }
      setLoadingMsg(msgList[counter]);
      counter += 1;
    }, 15000);

    initMatrix.once('init_loading_finished', () => {
      clearInterval(iId);
      initHotkeys();
      initRoomListListener(initMatrix.roomList);
      changeLoading(false);

      initMatrix.notifications.on('notifications_click', (room) => {
        const roomType = room.getType();
        console.log('in notification event');

        navigate('/chat');

        if (roomType === 'Channels') {
          localStorage.setItem('last_used_tab', 'Channels');
          localStorage.setItem('channel_roomid', room.roomId);
        } else {
          localStorage.setItem('last_used_tab', 'DM');
          localStorage.setItem('dm_roomid', room.roomId);
        }
      });
    });

    initMatrix.once('init_loading_error', () => {
      setIsErrorState(true);
    });
    initMatrix.init();
  }, []);

  function getHomeNoti() {
    const { roomList, accountData, notifications } = initMatrix;
    const orphans = roomList.getOrphans();
    let noti: { total: any; highlight: any } | null = null;

    orphans.forEach((roomId: any) => {
      if (accountData.spaceShortcut.has(roomId)) return;
      if (!notifications.hasNoti(roomId)) return;
      if (noti === null) noti = { total: 0, highlight: 0 };
      const childNoti = notifications.getNoti(roomId);
      noti.total += childNoti.total;
      noti.highlight += childNoti.highlight;
    });
    setHomeNoti(noti);
  }
  function getDMsNoti() {
    const { roomList, accountData, notifications } = initMatrix;
    if (roomList.directs.size === 0) return null;
    let noti: { total: any; highlight: any } | null = null;

    [...roomList.directs].forEach((roomId) => {
      if (!notifications.hasNoti(roomId)) return;
      if (noti === null) noti = { total: 0, highlight: 0 };
      const childNoti = notifications.getNoti(roomId);
      noti.total += childNoti.total;
      noti.highlight += childNoti.highlight;
    });

    setDmNoti(noti);
  }

  useEffect(() => {
    if (!isChatLoading) {
      getDMsNoti();
      getHomeNoti();

      const { roomList } = initMatrix;
      const onInviteListChange = () => {
        setTotalInvites(
          roomList.inviteRooms.size + roomList.inviteSpaces.size + roomList.inviteDirects.size
        );
      };
      roomList.on(cons.events.roomList.INVITELIST_UPDATED, onInviteListChange);
      return () => {
        roomList.removeListener(cons.events.roomList.INVITELIST_UPDATED, onInviteListChange);
      };
    }
  }, [isChatLoading]);

  if (isChatLoading) {
    if (location.pathname?.includes('chat')) {
      return (
        <div className="loading-display">
          <div className="loading__menu">
            <ContextMenu
              placement="bottom"
              content={
                <>
                  <MenuItem onClick={() => initMatrix.clearCacheAndReload()}>
                    Clear cache & reload
                  </MenuItem>
                  <MenuItem onClick={() => initMatrix.logout()}>Logout</MenuItem>
                </>
              }
              render={(toggle) => (
                <IconButton size="extra-small" onClick={toggle} src={<div>Icon</div>} />
              )}
            />
          </div>
          <Spinner />
          <Text className="loading__message" variant="b2">
            {loadingMsg}
          </Text>

          {/* <div className="loading__appname">
          <Text variant="h2" weight="medium">
            Cinny
          </Text>
        </div> */}
        </div>
      );
    }
    // return React.cloneElement(children, {
    //   isChatLoading: true
    // })
  }

  return (
    <FeatureCheck>
      <ClientConfigProvider
        value={{
          defaultHomeserver: 2,
          homeserverList: [
            'converser.eu',
            'envs.net',
            'matrix.org',
            'monero.social',
            'mozilla.org',
            'xmr.se',
          ],
          allowCustomHomeservers: true,
          hashRouter: {
            enabled: false,
            basename: '/',
          },
        }}
      >
        <JotaiProvider>
          <ChatWrapperProvider
            value={{
              navWrapperRef,
              roomWrapperRef,
              selectedUser,
              setSelectedUser,
              isThreadOpen,
              setIsThreadOpen,
              threadEventId,
              setThreadEventId,
              selectedTab,
              navigation,
              showChat,
              setShowChat,
              isErrorState,
              dmNoti,
              homeNoti,
              totalInvites,
            }}
          >
            <MatrixClientProvider value={initMatrix.matrixClient}>
              {React.cloneElement(children, {
                isChatLoading: isChatLoading,
              })}
              {!isChatLoading && (
                <>
                  <Windows />
                  <Dialogs />
                  <ReusableContextMenu />
                  <SystemEmojiFeature />
                </>
              )}
            </MatrixClientProvider>
          </ChatWrapperProvider>
        </JotaiProvider>
      </ClientConfigProvider>
      {/* )}
      </ClientConfigLoader> */}
    </FeatureCheck>
  );
};

export default ChatWrapper2;
