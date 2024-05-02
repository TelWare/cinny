import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import './InviteUser.scss';
// import { Customtagbar } from "../../../../config/global.style"
import initMatrix from '../../client/initMatrix';
import cons from '../../client/state/cons';
import * as roomActions from '../../client/action/room';
import { selectRoom } from '../../client/action/navigation';
import { hasDMWith, hasDevices } from '../../util/matrixUtil';
import RemoveCloseIcon from '../../../Icons/RemoveClose';
import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';
import IconButton from '../../atoms/button/IconButton';
import Spinner from '../../atoms/spinner/Spinner';
import Input from '../../atoms/input/Input';
import PopupWindow from '../../molecules/popup-window/PopupWindow';
import RoomTile from '../../molecules/room-tile/RoomTile';
import { Space, Tag, Tooltip } from 'antd';
import CrossIC from '../../public/res/ic/outlined/cross.svg';
import UserIC from '../../public/res/ic/outlined/user.svg';
import ChatWrapperContext from '../../ChatWrapper2/ChatWrapper2Context';
import ScrollView from '../../atoms/scroll/ScrollView';

function InviteUser({ isOpen, roomId, searchTerm, onRequestClose }) {
  const [isSearching, updateIsSearching] = useState(false);
  const [searchQuery, updateSearchQuery] = useState({});
  const [allUsers, updateAllUsers] = useState([]);
  const [users, updateUsers] = useState([]);
  const [creatingDM, setCreatingDM] = useState(false);
  const { selectedUser, setSelectedUser } = useContext(ChatWrapperContext);

  const [procUsers, updateProcUsers] = useState(new Set()); // proc stands for processing.
  const [procUserError, updateUserProcError] = useState(new Map());
  const [createdDM, updateCreatedDM] = useState(new Map());
  const [roomIdToUserId, updateRoomIdToUserId] = useState(new Map());
  const [groupName, setGroupName] = useState('');
  const [invitedUserIds, updateInvitedUserIds] = useState(new Set());

  const usernameRef = useRef(null);

  const mx = initMatrix.matrixClient;

  const handleDeleteUser = (userId) => {
    const updatedUsers = selectedUser.filter((user) => user.user_id !== userId);
    setSelectedUser(updatedUsers);
  };

  function getMapCopy(myMap) {
    const newMap = new Map();
    myMap.forEach((data, key) => {
      newMap.set(key, data);
    });
    return newMap;
  }
  function addUserToProc(userId) {
    procUsers.add(userId);
    updateProcUsers(new Set(Array.from(procUsers)));
  }
  function deleteUserFromProc(userId) {
    procUsers.delete(userId);
    updateProcUsers(new Set(Array.from(procUsers)));
  }

  function onDMCreated(newRoomId) {
    const myDMPartnerId = roomIdToUserId.get(newRoomId);
    if (typeof myDMPartnerId === 'undefined') return;

    createdDM.set(myDMPartnerId, newRoomId);
    roomIdToUserId.delete(newRoomId);

    deleteUserFromProc(myDMPartnerId);
    updateCreatedDM(getMapCopy(createdDM));
    updateRoomIdToUserId(getMapCopy(roomIdToUserId));
  }

  async function searchUser(username) {
    const inputUsername = username.trim();

    if (inputUsername === searchQuery.username) {
      return;
    }

    if (isSearching || inputUsername === '') {
      updateUsers([]);
      updateSearchQuery({});
      return;
    }
    const isInputUserId = inputUsername[0] === '@' && inputUsername.indexOf(':') > 1;
    updateIsSearching(true);
    updateSearchQuery({ username: inputUsername });

    if (isInputUserId) {
      try {
        const result = await mx.getProfileInfo(inputUsername);
        updateUsers([
          {
            user_id: inputUsername,
            display_name: result.displayname,
            avatar_url: result.avatar_url,
          },
        ]);
      } catch (e) {
        updateSearchQuery({ error: `${inputUsername} not found!` });
      }
    } else {
      try {
        console.log(inputUsername);
        const result = await mx.searchUserDirectory({
          term: inputUsername,
          limit: 20,
        });

        if (result.results.length === 0) {
          updateSearchQuery({
            error: `No matches found for "${inputUsername}"!`,
          });
          updateUsers([]);
          updateIsSearching(false);
          return;
        }
        updateUsers(result.results);
      } catch (e) {
        updateSearchQuery({ error: 'Something went wrong!' });
      }
    }
    updateIsSearching(false);
  }

  async function createDM(users) {
    setCreatingDM(true);
    const selectedUserIds = users.map((user) => user.user_id);

    if (selectedUserIds.length === 1) {
      if (mx.getUserId() === selectedUserIds[0]) return;
      const dmRoomId = hasDMWith(selectedUserIds[0]);

      if (dmRoomId) {
        selectRoom(dmRoomId);
        setSelectedUser([]);
        setCreatingDM(false);
        onRequestClose();
        return;
      }
    }

    try {
      addUserToProc(selectedUserIds);
      procUserError.delete(selectedUserIds);
      updateUserProcError(getMapCopy(procUserError));

      const result = await roomActions.createDM(
        selectedUserIds,
        await hasDevices(selectedUserIds),
        groupName
      );
      roomIdToUserId.set(result.room_id, selectedUserIds);
      updateRoomIdToUserId(getMapCopy(roomIdToUserId));
      setSelectedUser([]);
      selectRoom(result.room_id);
      setCreatingDM(false);
      onRequestClose();
    } catch (e) {
      deleteUserFromProc(selectedUserIds);
      if (typeof e.message === 'string') procUserError.set(selectedUserIds, e.message);
      else procUserError.set(selectedUserIds, 'Something went wrong!');
      updateUserProcError(getMapCopy(procUserError));
      setCreatingDM(false);
      setSelectedUser([]);
    }
  }

  async function inviteToRoom(userId) {
    if (typeof roomId === 'undefined') return;
    try {
      addUserToProc(userId);
      procUserError.delete(userId);
      updateUserProcError(getMapCopy(procUserError));

      await roomActions.invite(roomId, userId);

      invitedUserIds.add(userId);
      updateInvitedUserIds(new Set(Array.from(invitedUserIds)));
      deleteUserFromProc(userId);
    } catch (e) {
      deleteUserFromProc(userId);
      if (typeof e.message === 'string') procUserError.set(userId, e.message);
      else procUserError.set(userId, 'Something went wrong!');
      updateUserProcError(getMapCopy(procUserError));
    }
  }

  const handleAddUser = (user) => {
    setSelectedUser((prev) => [...prev, user]);
  };

  function renderUserList() {
    const renderOptions = (user) => {
      const messageJSX = (message, isPositive) => (
        <Text variant="b2">
          <span
            style={{
              color: isPositive ? 'var(--bg-positive)' : 'var(--bg-negative)',
            }}
          >
            {message}
          </span>
        </Text>
      );

      if (mx.getUserId() === user.user_id) return null;
      if (procUsers.has(user.user_id)) {
        return <Spinner size="small" />;
      }
      if (createdDM.has(user.user_id)) {
        return (
          <Button
            onClick={() => {
              selectRoom(createdDM.get(user.user_id));
              onRequestClose();
            }}
          >
            Open
          </Button>
        );
      }
      if (invitedUserIds.has(user.user_id)) {
        return messageJSX('Invited', true);
      }
      if (typeof roomId === 'string') {
        const member = mx.getRoom(roomId).getMember(user.user_id);
        if (member !== null) {
          const userMembership = member.membership;
          switch (userMembership) {
            case 'join':
              return messageJSX('Already joined', true);
            case 'invite':
              return messageJSX('Already Invited', true);
            case 'ban':
              return messageJSX('Banned', false);
            default:
          }
        }
      }

      const isUserAdded = selectedUser.some((selected) => selected.user_id === user.user_id);

      return typeof roomId === 'string' ? (
        <Button disabled={isUserAdded} onClick={() => inviteToRoom(user.user_id)} variant="primary">
          Invite
        </Button>
      ) : (
        <Button
          disabled={isUserAdded} // Disable if user is already added
          onClick={() => {
            handleAddUser(user);
          }}
          variant="primary"
        >
          Add
        </Button>
      );
    };

    const renderError = (userId) => {
      if (!procUserError.has(userId)) return null;
      return (
        <Text variant="b2">
          <span style={{ color: 'var(--bg-danger)' }}>{procUserError.get(userId)}</span>
        </Text>
      );
    };

    //if filtered users are not there, showing default api response of all users
    const showUser = users.length !== 0 ? users : allUsers;

    return showUser.map((user) => {
      const userId = user.user_id;
      const name = typeof user.display_name === 'string' ? user.display_name : userId;
      return (
        <RoomTile
          key={userId}
          avatarSrc={user.avatar_url}
          name={name}
          id={userId}
          options={renderOptions(user)}
          desc={renderError(userId)}
        />
      );
    });
  }

  useEffect(() => {
    if (isOpen && typeof searchTerm === 'string') searchUser(searchTerm);
    return () => {
      updateIsSearching(false);
      updateSearchQuery({});
      updateUsers([]);
      updateProcUsers(new Set());
      updateUserProcError(new Map());
      updateCreatedDM(new Map());
      updateRoomIdToUserId(new Map());
      updateInvitedUserIds(new Set());
    };
  }, [isOpen, searchTerm]);

  useEffect(() => {
    initMatrix.roomList.on(cons.events.roomList.ROOM_CREATED, onDMCreated);
    return () => {
      initMatrix.roomList.removeListener(cons.events.roomList.ROOM_CREATED, onDMCreated);
    };
  }, [isOpen, procUsers, createdDM, roomIdToUserId]);
  const onGroupNameChange = async (e) => {
    setGroupName(e.target.value);
  };
  return (
    <PopupWindow
      isOpen={isOpen}
      title={typeof roomId === 'string' ? `Invite to ${mx.getRoom(roomId).name}` : 'Direct message'}
      contentOptions={<IconButton src={CrossIC} onClick={onRequestClose} tooltip="Close" />}
      onRequestClose={onRequestClose}
    >
      <div className="invite-user">
        <form
          className="invite-user__form"
          onSubmit={(e) => {
            e.preventDefault();
            searchUser(usernameRef.current.value);
          }}
        >
          <Input value={searchTerm} forwardRef={usernameRef} label="Name or userId" />
          <Button disabled={isSearching} iconSrc={UserIC} variant="primary" type="submit">
            Search
          </Button>
        </form>
        {selectedUser?.length > 1 && (
          <div style={{ marginTop: '20px' }}>
            <Input
              label="Group Name"
              value={groupName}
              placeholder="Enter an optional name for this Group"
              onChange={onGroupNameChange}
              className="personsearch"
              maxLength={50}
            />
          </div>
        )}
        {selectedUser.length !== 0 && (
          <div className="person-search-result">
            {/* <Customtagbar> */}
            <Space className="space-wrap">
              {selectedUser.map((userData) => {
                return (
                  <Tooltip title={`${userData.user_id}`} key={userData.user_id}>
                    <Tag
                      closable
                      closeIcon={<RemoveCloseIcon />}
                      onClose={() => handleDeleteUser(userData.user_id)}
                    >
                      <span className="profilecover-icon-wrapper">
                        <img
                          src={userData.avatar_url}
                          alt={userData.display_name}
                          className="avatar"
                        />
                      </span>

                      <div className="data">{userData.display_name}</div>
                    </Tag>
                  </Tooltip>
                );
              })}
            </Space>
            {/* </Customtagbar> */}
          </div>
        )}
        <div className="invite-user__search-status">
          {typeof searchQuery.username !== 'undefined' && isSearching && (
            <div className="flex--center">
              <Spinner size="small" />
              <Text variant="b2">{`Searching for user "${searchQuery.username}"...`}</Text>
            </div>
          )}
          {typeof searchQuery.username !== 'undefined' && !isSearching && (
            <Text variant="b2">{`Search result for user "${searchQuery.username}"`}</Text>
          )}
          {searchQuery.error && (
            <Text className="invite-user__search-error" variant="b2">
              {searchQuery.error}
            </Text>
          )}
        </div>

        <ScrollView autoHide>
          {isSearching && typeof searchQuery.username === 'undefined' && (
            <div className="flex--center">
              <Spinner size="small" />
            </div>
          )}

          {allUsers.length !== 0 && <div className="invite-user__content">{renderUserList()}</div>}
        </ScrollView>
      </div>
      {typeof roomId !== 'string' && (
        <div className="start_conversation">
          <button
            className={`${
              selectedUser.length === 0
                ? 'disable_start_consversation_button'
                : 'start_consversation_button'
            }`}
            disabled={selectedUser.length === 0 ? true : false}
            onClick={() => createDM(selectedUser)}
          >
            {creatingDM ? <Spinner size="small" /> : 'Start Conversation'}
          </button>
        </div>
      )}
    </PopupWindow>
  );
}

InviteUser.defaultProps = {
  roomId: undefined,
  searchTerm: undefined,
};

InviteUser.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  roomId: PropTypes.string,
  searchTerm: PropTypes.string,
  onRequestClose: PropTypes.func.isRequired,
};

export default InviteUser;
